import UIKit
import Capacitor
import StoreKit
import KidozSDK

@objc(LinguaBridgeViewController)
class LinguaBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(LinguaTurtleCommercePlugin())
    }
}

@objc(LinguaTurtleCommercePlugin)
public class LinguaTurtleCommercePlugin: CAPPlugin, CAPBridgedPlugin, KidozInitDelegate, KidozRewardedDelegate {
    public let identifier = "LinguaTurtleCommercePlugin"
    public let jsName = "LinguaTurtleCommerce"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncPurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finishPurchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showRewarded", returnType: CAPPluginReturnPromise)
    ]

    private var rewardedAd: KidozRewardedAd?
    private var pendingRewardCall: CAPPluginCall?
    private var rewardReceived = false
    private var initializeThenLoadReward = false

    private var productIds: [String] {
        [
            "com.linguaturtle.shells.150",
            "com.linguaturtle.shells.450",
            "com.linguaturtle.shells.1000"
        ]
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        let requested = call.getArray("productIds", String.self) ?? productIds
        Task {
            do {
                let products = try await Product.products(for: requested)
                let payload = products.map { product in
                    [
                        "id": product.id,
                        "title": product.displayName,
                        "description": product.description,
                        "displayPrice": product.displayPrice
                    ]
                }
                call.resolve(["products": payload])
            } catch {
                call.reject("App-Store-Produkte konnten nicht geladen werden.", "catalog_failed", error)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), productIds.contains(productId) else {
            call.reject("Ungültige Produkt-ID.", "invalid_product")
            return
        }
        guard let accountId = call.getString("accountId"), let accountToken = UUID(uuidString: accountId) else {
            call.reject("Elternkonto-ID fehlt.", "invalid_account")
            return
        }
        Task {
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.reject("Produkt ist im App Store nicht verfügbar.", "product_unavailable")
                    return
                }
                let result = try await product.purchase(options: [.appAccountToken(accountToken)])
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        call.resolve([
                            "platform": "ios",
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id),
                            "signedTransaction": verification.jwsRepresentation,
                            "state": "purchased"
                        ])
                    case .unverified(_, let error):
                        call.reject("Die App-Store-Transaktion ist nicht verifiziert.", "purchase_unverified", error)
                    }
                case .pending:
                    call.resolve([
                        "platform": "ios",
                        "productId": productId,
                        "state": "pending"
                    ])
                case .userCancelled:
                    call.reject("Kauf wurde abgebrochen.", "purchase_cancelled")
                @unknown default:
                    call.reject("Unbekannter App-Store-Status.", "purchase_unknown")
                }
            } catch {
                call.reject("Der Kauf konnte nicht abgeschlossen werden.", "purchase_failed", error)
            }
        }
    }

    @objc func syncPurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                var purchases: [[String: Any]] = []
                for await result in Transaction.unfinished {
                    if case .verified(let transaction) = result, productIds.contains(transaction.productID) {
                        purchases.append([
                            "platform": "ios",
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id),
                            "signedTransaction": result.jwsRepresentation,
                            "state": "purchased"
                        ])
                    }
                }
                call.resolve(["purchases": purchases])
            } catch {
                call.reject("Käufe konnten nicht synchronisiert werden.", "sync_failed", error)
            }
        }
    }

    @objc func finishPurchase(_ call: CAPPluginCall) {
        guard let transactionId = call.getString("transactionId") else {
            call.reject("Transaktions-ID fehlt.", "invalid_purchase")
            return
        }
        Task {
            for await result in Transaction.unfinished {
                if case .verified(let transaction) = result, String(transaction.id) == transactionId {
                    await transaction.finish()
                    call.resolve(["finished": true, "transactionId": transactionId])
                    return
                }
            }
            // A repeated finish request is idempotently successful.
            call.resolve(["finished": true, "transactionId": transactionId])
        }
    }

    @objc func showRewarded(_ call: CAPPluginCall) {
        guard pendingRewardCall == nil else {
            call.reject("Eine Werbung wird bereits gezeigt.", "ad_in_progress")
            return
        }
        guard iosRewardedAdsEnabled else {
            call.reject("Rewarded Ads sind auf iOS nicht freigegeben.", "ads_disabled")
            return
        }
        pendingRewardCall = call
        rewardReceived = false
        if Kidoz.instance.isSDKInitialized() {
            KidozRewardedAd.load(delegate: self)
            return
        }
        guard !kidozPublisherId.isEmpty, !kidozSecurityToken.isEmpty else {
            rejectReward("Kidoz-Zugangsdaten fehlen.", code: "ads_unconfigured")
            return
        }
        initializeThenLoadReward = true
        Kidoz.instance.initialize(
            publisherID: kidozPublisherId,
            securityToken: kidozSecurityToken,
            delegate: self
        )
    }

    private var kidozPublisherId: String {
        normalizedInfoValue("LINGUATURTLE_KIDOZ_PUBLISHER_ID")
    }

    private var kidozSecurityToken: String {
        normalizedInfoValue("LINGUATURTLE_KIDOZ_SECURITY_TOKEN")
    }

    private var iosRewardedAdsEnabled: Bool {
        ["YES", "TRUE", "1"].contains(
            normalizedInfoValue("LINGUATURTLE_IOS_REWARDED_ADS_ENABLED").uppercased()
        )
    }

    private func normalizedInfoValue(_ key: String) -> String {
        let value = Bundle.main.object(forInfoDictionaryKey: key) as? String ?? ""
        return value.contains("$(") ? "" : value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func rejectReward(_ message: String, code: String) {
        let call = pendingRewardCall
        pendingRewardCall = nil
        call?.reject(message, code)
    }

    public func onInitSuccess() {
        if initializeThenLoadReward {
            initializeThenLoadReward = false
            KidozRewardedAd.load(delegate: self)
        }
    }

    public func onInitError(_ error: String) {
        initializeThenLoadReward = false
        rejectReward(error, code: "ads_init_failed")
    }

    public func onRewardedAdLoaded(kidozRewardedAd: KidozRewardedAd) {
        rewardedAd = kidozRewardedAd
        guard let controller = bridge?.viewController else {
            rejectReward("Kein aktiver View Controller.", code: "ad_show_failed")
            return
        }
        kidozRewardedAd.show(viewController: controller)
    }

    public func onRewardedAdFailedToLoad(kidozError: KidozError) {
        rejectReward(kidozError.description, code: "ad_load_failed")
    }

    public func onRewardedAdShown(kidozRewardedAd: KidozRewardedAd) {}

    public func onRewardedAdFailedToShow(kidozRewardedAd: KidozRewardedAd, kidozError: KidozError) {
        rewardedAd = nil
        rejectReward(kidozError.description, code: "ad_show_failed")
    }

    public func onRewardReceived(kidozRewardedAd: KidozRewardedAd) {
        rewardReceived = true
    }

    public func onRewardedImpression(kidozRewardedAd: KidozRewardedAd) {}

    public func onRewardedAdClosed(kidozRewardedAd: KidozRewardedAd) {
        rewardedAd = nil
        let call = pendingRewardCall
        pendingRewardCall = nil
        call?.resolve(["completed": rewardReceived, "provider": "kidoz"])
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {

        let config = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }

}

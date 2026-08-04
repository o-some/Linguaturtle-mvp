package com.linguaturtle.app;

import androidx.annotation.NonNull;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import net.kidoz.ads.fullscreen.rewarded.KidozRewardedAd;
import net.kidoz.ads.fullscreen.rewarded.KidozRewardedAdCallback;
import net.kidoz.sdk.Kidoz;
import net.kidoz.sdk.KidozError;
import net.kidoz.sdk.KidozInitializationListener;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "LinguaTurtleCommerce")
public class LinguaTurtleCommercePlugin extends Plugin implements PurchasesUpdatedListener {
    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;
    private PluginCall pendingRewardCall;
    private boolean kidozInitialized = false;
    private boolean kidozInitializing = false;
    private KidozRewardedAd rewardedAd;
    private final AtomicBoolean rewardReceived = new AtomicBoolean(false);

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
            )
            .enableAutoServiceReconnection()
            .build();
    }

    private void withBilling(PluginCall call, Runnable action) {
        if (billingClient.isReady()) {
            action.run();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    action.run();
                } else {
                    call.reject("Google Play Billing ist nicht verfügbar: " + result.getDebugMessage(), "billing_unavailable");
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Automatic reconnection is enabled; the next request retries.
            }
        });
    }

    private List<String> productIds(PluginCall call) throws JSONException {
        JSArray values = call.getArray("productIds", new JSArray());
        List<String> ids = new ArrayList<>();
        for (int index = 0; index < values.length(); index += 1) {
            String value = values.getString(index);
            if (value != null && !value.isBlank()) ids.add(value);
        }
        return ids;
    }

    private QueryProductDetailsParams queryParams(List<String> ids) {
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (String id : ids) {
            products.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(id)
                .setProductType(BillingClient.ProductType.INAPP)
                .build());
        }
        return QueryProductDetailsParams.newBuilder().setProductList(products).build();
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        final List<String> ids;
        try {
            ids = productIds(call);
        } catch (JSONException error) {
            call.reject("Ungültige Produktliste.", "invalid_products", error);
            return;
        }
        withBilling(call, () -> billingClient.queryProductDetailsAsync(queryParams(ids), (result, detailsResult) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject(result.getDebugMessage(), "catalog_failed");
                return;
            }
            JSArray products = new JSArray();
            for (ProductDetails details : detailsResult.getProductDetailsList()) {
                ProductDetails.OneTimePurchaseOfferDetails offer = details.getOneTimePurchaseOfferDetails();
                JSObject item = new JSObject();
                item.put("id", details.getProductId());
                item.put("title", details.getTitle());
                item.put("description", details.getDescription());
                item.put("displayPrice", offer == null ? "" : offer.getFormattedPrice());
                item.put("priceMicros", offer == null ? 0 : offer.getPriceAmountMicros());
                item.put("currencyCode", offer == null ? "" : offer.getPriceCurrencyCode());
                products.put(item);
            }
            JSObject response = new JSObject();
            response.put("products", products);
            call.resolve(response);
        }));
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId", "");
        String accountId = call.getString("accountId", "");
        if (productId.isBlank() || accountId.isBlank()) {
            call.reject("Produkt- oder Elternkonto-ID fehlt.", "invalid_purchase");
            return;
        }
        if (pendingPurchaseCall != null) {
            call.reject("Ein Kauf ist bereits geöffnet.", "purchase_in_progress");
            return;
        }
        withBilling(call, () -> billingClient.queryProductDetailsAsync(queryParams(Collections.singletonList(productId)), (result, detailsResult) -> {
            List<ProductDetails> products = detailsResult.getProductDetailsList();
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || products.isEmpty()) {
                call.reject("Produkt ist im Play Store nicht verfügbar.", "product_unavailable");
                return;
            }
            BillingFlowParams.ProductDetailsParams productParams =
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(products.get(0))
                    .build();
            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(productParams))
                .setObfuscatedAccountId(accountId)
                .build();
            pendingPurchaseCall = call;
            BillingResult launchResult = billingClient.launchBillingFlow(getActivity(), flowParams);
            if (launchResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                pendingPurchaseCall = null;
                call.reject(launchResult.getDebugMessage(), "purchase_launch_failed");
            }
        }));
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult result, List<Purchase> purchases) {
        PluginCall call = pendingPurchaseCall;
        if (call == null) return;
        if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            pendingPurchaseCall = null;
            call.reject("Kauf wurde abgebrochen.", "purchase_cancelled");
            return;
        }
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null || purchases.isEmpty()) {
            pendingPurchaseCall = null;
            call.reject(result.getDebugMessage(), "purchase_failed");
            return;
        }
        pendingPurchaseCall = null;
        call.resolve(purchasePayload(purchases.get(0)));
    }

    private JSObject purchasePayload(Purchase purchase) {
        JSObject payload = new JSObject();
        payload.put("platform", "android");
        payload.put("purchaseToken", purchase.getPurchaseToken());
        payload.put("transactionId", purchase.getPurchaseToken());
        payload.put("productId", purchase.getProducts().isEmpty() ? "" : purchase.getProducts().get(0));
        payload.put("state", purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED ? "purchased" : "pending");
        payload.put("acknowledged", purchase.isAcknowledged());
        return payload;
    }

    @PluginMethod
    public void syncPurchases(PluginCall call) {
        withBilling(call, () -> billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
            (result, purchases) -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject(result.getDebugMessage(), "sync_failed");
                    return;
                }
                JSArray values = new JSArray();
                for (Purchase purchase : purchases) values.put(purchasePayload(purchase));
                JSObject response = new JSObject();
                response.put("purchases", values);
                call.resolve(response);
            }
        ));
    }

    @PluginMethod
    public void finishPurchase(PluginCall call) {
        String token = call.getString("purchaseToken", "");
        if (token.isBlank()) {
            call.reject("Purchase Token fehlt.", "invalid_purchase");
            return;
        }
        withBilling(call, () -> billingClient.consumeAsync(
            ConsumeParams.newBuilder().setPurchaseToken(token).build(),
            (result, consumedToken) -> {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    JSObject response = new JSObject();
                    response.put("finished", true);
                    response.put("purchaseToken", consumedToken);
                    call.resolve(response);
                } else {
                    call.reject(result.getDebugMessage(), "consume_failed");
                }
            }
        ));
    }

    private void initializeKidoz(PluginCall call, Runnable action) {
        if (BuildConfig.KIDOZ_PUBLISHER_ID.isBlank() || BuildConfig.KIDOZ_SECURITY_TOKEN.isBlank()) {
            call.reject("Kidoz-Zugangsdaten fehlen.", "ads_unconfigured");
            return;
        }
        if (kidozInitialized) {
            action.run();
            return;
        }
        if (kidozInitializing) {
            call.reject("Werbung wird gerade vorbereitet.", "ads_initializing");
            return;
        }
        kidozInitializing = true;
        Kidoz.initialize(getActivity(), BuildConfig.KIDOZ_PUBLISHER_ID, BuildConfig.KIDOZ_SECURITY_TOKEN,
            new KidozInitializationListener() {
                @Override
                public void onInitSuccess() {
                    kidozInitializing = false;
                    kidozInitialized = true;
                    action.run();
                }

                @Override
                public void onInitError(KidozError error) {
                    kidozInitializing = false;
                    call.reject(error.getMessage(), "ads_init_failed");
                }
            });
    }

    @PluginMethod
    public void showRewarded(PluginCall call) {
        if (pendingRewardCall != null) {
            call.reject("Eine Werbung wird bereits gezeigt.", "ad_in_progress");
            return;
        }
        pendingRewardCall = call;
        rewardReceived.set(false);
        initializeKidoz(call, () -> KidozRewardedAd.load(getActivity(), new KidozRewardedAdCallback() {
            @Override
            public void onAdLoaded(KidozRewardedAd ad) {
                rewardedAd = ad;
                ad.show();
            }

            @Override
            public void onAdFailedToLoad(KidozError error) {
                rejectReward(error.getMessage(), "ad_load_failed");
            }

            @Override public void onAdShown(KidozRewardedAd ad) {}
            @Override public void onAdImpression(KidozRewardedAd ad) {}

            @Override
            public void onAdFailedToShow(KidozRewardedAd ad, KidozError error) {
                rewardedAd = null;
                rejectReward(error.getMessage(), "ad_show_failed");
            }

            @Override
            public void onRewardReceived(KidozRewardedAd ad) {
                rewardReceived.set(true);
            }

            @Override
            public void onAdClosed(KidozRewardedAd ad) {
                rewardedAd = null;
                PluginCall activeCall = pendingRewardCall;
                pendingRewardCall = null;
                if (activeCall == null) return;
                JSObject response = new JSObject();
                response.put("completed", rewardReceived.get());
                response.put("provider", "kidoz");
                activeCall.resolve(response);
            }
        }));
    }

    private void rejectReward(String message, String code) {
        PluginCall call = pendingRewardCall;
        pendingRewardCall = null;
        if (call != null) call.reject(message, code);
    }
}

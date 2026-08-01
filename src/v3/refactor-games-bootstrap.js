import { createRouter } from './core/index.js';
import { installCoreLearningGames } from './games/core-learning.js';

const app = document.querySelector('#app');
const router = createRouter(app);
installCoreLearningGames(router);
router.renderCurrent();

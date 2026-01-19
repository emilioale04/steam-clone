import groupRoutes from './routes/groupRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import consentRoutes from './routes/consentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';

export default function registerCommunityRoutes(app) {
    app.use('/api/community/groups', groupRoutes);
    app.use('/api/community/forum', forumRoutes);
    app.use('/api/community/consent', consentRoutes);
    app.use('/api/community', reportRoutes);
    app.use('/api/community', communityRoutes);
    app.use('/api/community', permissionRoutes);
}

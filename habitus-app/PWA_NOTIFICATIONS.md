# PWA & Push Notifications Setup - OneSignal

## Overview

This app now supports PWA installation and push notifications across iOS, Android, and desktop platforms using:

1. **Vite PWA Plugin** - Service worker generation and caching
2. **OneSignal** - Push notification delivery (App ID: `8ab2d231-41db-49a5-9543-eac1df3986b4`)
3. **Custom notification service** - Unified notification API

## OneSignal Configuration

### Current Setup
- **App ID**: `8ab2d231-41db-49a5-9543-eac1df3986b4`
- **SDK Version**: Web v16
- **Platform**: Web Push (Chrome, Firefox, Safari, Edge)

### Dashboard Configuration

1. Go to https://onesignal.com
2. Navigate to your app dashboard
3. Configure:
   - **Site Name**: : moon shared living
   - **Site URL**: https://moonsharedliving.com
   - **Icon**: Upload `/brand/moon-logo-black.png`
   - **Default Notification Icon**: `/brand/moon-logo-black.png`

### Safari Web Push (iOS/macOS)

For iOS 16.4+ support, configure Safari Web Push:

1. In OneSignal Dashboard, go to Settings → Platforms → Safari
2. Upload your `website.json` (Apple Push Notification service certificate)
3. Add the Safari Web ID to the config (already included: `web.onesignal.auto.3a1a06c8-1200-4cc7-85f6-07c69a325517`)

## Features

### PWA Installation
- Automatic install prompts for desktop users (Chrome/Edge)
- Custom install prompts for mobile users
- Install button in settings
- Install status detection

### Push Notifications
- Permission request prompts with OneSignal slidedown
- Push subscription management
- Local notification fallback for testing
- Cross-platform support (iOS 16.4+, Android, Desktop)

### Service Worker
- Automatic caching of static assets via Vite PWA
- Offline support
- Background sync ready
- Periodic updates

### OneSignal Features
- User segmentation with tags
- External user ID linking (Supabase user ID)
- Delivery analytics
- Scheduled notifications
- Automated messages

## Usage

### In Components

```tsx
import { notificationService } from '@/services/notifications';

// Initialize (must be called first)
await notificationService.initialize();

// Request permission
const granted = await notificationService.requestPermission();

// Check subscription status
const subscribed = await notificationService.isSubscribed();

// Set external ID (link with Supabase user)
await notificationService.setExternalId(user.id);

// Set user tags for segmentation
await notificationService.setTags({
  user_role: 'inquilino',
  city: 'barcelona',
});

// Show local notification (for testing)
await notificationService.sendTestNotification({
  title: 'New message',
  body: 'You have a new message from Juan',
});

// Check if app is installed
const isInstalled = notificationService.isInstalled();

// Show install prompt
const installed = await notificationService.showInstallPrompt();
```

### React Hook

```tsx
import { useNotifications } from '@/services/notifications';

function MyComponent() {
  const {
    permission,
    isInstalled,
    isSubscribed,
    requestPermission,
    setExternalId,
    setTags,
    sendTestNotification
  } = useNotifications();

  useEffect(() => {
    // Initialize on mount
    if (user) {
      setExternalId(user.id);
      setTags({ role: user.role });
    }
  }, [user]);

  return (
    <div>
      <p>Permission: {permission}</p>
      <p>Subscribed: {isSubscribed ? 'Yes' : 'No'}</p>
      <button onClick={requestPermission}>Enable Notifications</button>
    </div>
  );
}
```

### Install Prompt Component

```tsx
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

// Add to App.tsx to show automatic install prompts
<PWAInstallPrompt />
```

### Notification Settings Component

```tsx
import { NotificationSettings } from '@/components/NotificationSettings';

<NotificationSettings />
```

## Sending Notifications

### From OneSignal Dashboard

1. Go to Messages → New Push
2. Choose your target audience (All users or segmented)
3. Compose your message
4. Schedule or send immediately

### Programmatic (Server-Side)

Use the OneSignal REST API from your backend:

```bash
curl -X POST \
  https://onesignal.com/api/v1/notifications \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Basic YOUR_REST_API_KEY' \
  -d '{
    "app_id": "8ab2d231-41db-49a5-9543-eac1df3986b4",
    "contents": {"en": "New message received"},
    "headings": {"en": ": moon shared living"},
    "include_external_user_ids": ["user_supabase_id"],
    "data": {"type": "message", "id": "123"}
  }'
```

## User Segmentation

### Tags for Segmentation

```tsx
// Set user tags
await notificationService.setTags({
  // User role
  user_role: 'inquilino', // or 'anfitrion', 'propietario', 'agencia'

  // Location
  city: 'barcelona', // or 'madrid'

  // Preferences
  price_range: '500-800',
  smoking: 'no',
  pets: 'yes',

  // Status
  profile_complete: 'true',
  has_active_application: 'false',
});
```

### Targeting Segments in OneSignal

1. Go to Audiences → New Segment
2. Create conditions based on tags
3. Use segments when sending notifications

## iOS Specific Notes

### Installation
1. User must visit the site in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Notification Support
- Requires iOS 16.4 or later
- Only works for installed PWAs (not browser tabs)
- User must grant permission in iOS Settings

### Safari Web Push Setup
To enable native push on iOS:
1. Create an Apple Developer account
2. Create a Push Notification certificate
3. Upload to OneSignal Dashboard
4. Configure Safari Web ID

## Testing

### Test Service Worker
```bash
npm run dev
# Open DevTools → Application → Service Workers
```

### Test Install Prompt
1. Open Chrome DevTools
2. Go to Application → Manifest
3. Click "Add to home screen"

### Test Notifications

**Via Dashboard:**
1. Go to OneSignal Dashboard
2. Send test notification to "Subscribed Users"

**Via Code:**
```typescript
await notificationService.sendTestNotification({
  title: 'Test',
  body: 'This is a test notification'
});
```

**Via Browser Console:**
```javascript
OneSignal.push(function() {
  OneSignal.showHttpPrompt();
});
```

## Files Added/Modified

### New Files
- `src/services/notifications.ts` - Notification service with OneSignal
- `src/components/PWAInstallPrompt.tsx` - Install prompts
- `src/components/NotificationSettings.tsx` - Settings UI
- `public/manifest.json` - PWA manifest (auto-generated by Vite PWA)

### Modified Files
- `vite.config.ts` - Added Vite PWA plugin
- `src/index.css` - Mobile performance optimizations
- `src/App.tsx` - Added PWAInstallPrompt
- `src/components/Header.tsx` - Safe area insets
- `src/components/BottomNav.tsx` - Safe area insets
- `src/components/PublicLayout.tsx` - Safe area insets
- `index.html` - OneSignal SDK script, PWA meta tags
- `.env.example` - OneSignal configuration

## Mobile Optimizations Applied

### CSS Optimizations
- `touch-action: manipulation` on all elements
- `-webkit-overflow-scrolling: touch` for smooth scrolling
- `overscroll-behavior-y: none` to prevent pull-to-refresh
- `will-change` and `translate3d` for GPU acceleration
- Reduced animations on touch devices
- Safe area insets for notched devices

### Layout Optimizations
- Safe area padding for headers (`pt-[env(safe-area-inset-top)]`)
- Safe area padding for bottom nav (`pb-[env(safe-area-inset-bottom)]`)
- Replaced `active:scale-95` with `active:opacity-70` to prevent jitter
- Fixed positioning with proper z-index management

### Performance Optimizations
- Content visibility for images
- Backface visibility hidden for glass effects
- Transform Z(0) for GPU compositing
- Optimized transition properties on touch devices

## Notification Types

### Recommended Notifications

1. **New Match**
   - Title: "¡Nuevo compañero compatible!"
   - Body: "{name} tiene un 95% de compatibilidad contigo"

2. **New Message**
   - Title: "{name} te envió un mensaje"
   - Body: "{preview}"

3. **Property Update**
   - Title: "Nuevo espacio disponible"
   - Body: "{title} en {neighborhood}"

4. **Application Status**
   - Title: "Tu solicitud fue aceptada"
   - Body: "¡Felicidades! Contacta al anfitrión"

5. **Reminder**
   - Title: "Completa tu perfil"
   - Body: "Sube más fotos para recibir más solicitudes"

## Analytics

### Track in OneSignal Dashboard

1. **Notification Open Rate**
   - Go to Analytics → Message Sent
   - View open rate and click rate

2. **Subscription Rate**
   - Go to Analytics → Subscriptions
   - Track new subscribers over time

3. **Platform Breakdown**
   - View subscriptions by platform (iOS, Android, Desktop)

4. **A/B Testing**
   - Test different notification copy
   - Compare open rates

## Troubleshooting

### Notifications not working on iOS
- Verify iOS version is 16.4+
- Ensure PWA is installed (not just a browser tab)
- Check notification permission in iOS Settings
- Verify Safari Web Push is configured in OneSignal

### Install prompt not showing
- Clear site data and refresh
- Check if already installed
- Verify PWA criteria met (HTTPS, manifest, service worker)
- For iOS, manual install required (Share → Add to Home Screen)

### Service worker not updating
- Check DevTools → Application → Service Workers
- Click "Update on reload" for development
- Clear site storage and refresh

### OneSignal SDK not loading
- Check browser console for errors
- Verify CDN script is loading in index.html
- Check if ad blockers are blocking the script

## Next Steps

1. **Production OneSignal App:**
   - Create your own app at https://onesignal.com
   - Update App ID in `src/services/notifications.ts`
   - Configure Safari Web Push for iOS

2. **Customize Prompts:**
   - Modify `PWAInstallPrompt.tsx` for custom messaging
   - Adjust timing and triggers

3. **Notification Types:**
   - Define notification categories in OneSignal dashboard
   - Create notification templates

4. **Analytics:**
   - Track install conversion rate
   - Monitor notification engagement
   - A/B test prompt timing and copy

5. **Backend Integration:**
   - Set up OneSignal REST API in your backend
   - Send notifications based on app events
   - Implement automated notification workflows

## Resources

- [OneSignal Web SDK Documentation](https://documentation.onesignal.com/docs/en/web-sdk-setup)
- [OneSignal REST API](https://documentation.onesignal.com/docs/onesignal-api)
- [PWA Best Practices](https://web.dev/pwa/)
- [Vite PWA Plugin](https://vite-pwa-plugin.netlify.app/)

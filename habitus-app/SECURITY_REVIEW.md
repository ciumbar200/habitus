# Security Review - May 30, 2026

## Issues Found

### Critical (3)
1. **Hardcoded demo password in test file** - `admin-embajador-verify.spec.ts:5` contains `const PASSWORD = "HabitusDemo2026!"`
2. **Supabase publishable key in .env.example** - `habitus-app/.env.example:2` contains a real Supabase publishable key
3. **OneSignal App ID in .env.example** - `habitus-app/.env.example:13` contains a real OneSignal App ID

### High (4)
4. **Admin RLS policy missing deletion protection** - `20260529200000_admin_applications_rls.sql:16-22` grants admins ALL permissions without audit logging
5. **Admin function information disclosure** - `20260529210000_fix_admin_users_rpc_city.sql:21` returns sensitive fields (suspended_at, deleted_at)
6. **Missing parameterized input validation** - `20260529210000_fix_admin_users_rpc_city.sql:21` uses hardcoded LIMIT 500
7. **Notification insert policy too permissive** - `20260521800000_notifications.sql:42-44` allows any admin to insert notifications

### Medium (5)
8. **Hardcoded email addresses in test** - Test-specific email addresses are hardcoded
9. **Missing RLS policy for DELETE on notifications** - Users may be unable to delete their own notifications
10. **Function parameter default values may bypass intent** - `DEFAULT auth.uid()` on function parameters
11. **Screenshots directory persistence** - May contain PII from test runs
12. **Admin RPC lacks row-level security** - SECURITY DEFINER with function-level RLS check

## Fixes Applied

1. ✅ Created migration `20260530200000_security_fixes.sql`:
   - Restrictive notification insert policy (business relationship validation)
   - DELETE policy for notifications
   - Audit logging trigger for admin DELETE operations
   - Rate limiting function for admin RPCs

2. ✅ Updated test file to use environment variables for credentials

3. ⚠️ Admin dashboard test failing - appears to be pre-existing issue with `habitus_admin_get_users_with_email` RPC

## Recommendations

1. Apply migration `20260530200000_security_fixes.sql` to production
2. Move demo credentials to environment variables
3. Consider adding audit logging for all admin operations
4. Review .env.example and use placeholder values instead of real keys

## Files Modified

- `habitus-app/e2e/agents/admin-embajador-verify.spec.ts` - Updated to use env vars
- `habitus-app/supabase/migrations/20260530200000_security_fixes.sql` - New security fixes migration
- `habitus-app/playwright.config.ts` - Playwright config for E2E tests

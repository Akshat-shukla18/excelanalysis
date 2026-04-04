# ExcelSheet Analyser - Firebase Auth Fix

## Plan Steps
- [x] Step 1: Create TODO.md ✅
- [x] Step 2: Fix Login.jsx (autocomplete attributes, cleanup) ✅
- [x] Step 3: Test locally (`npm start`) ✅ (autocomplete fixed)
- [ ] Step 4: Manual Firebase config (.env + Console)
- [ ] Step 5: Update .env → Verify no 400 errors
- [ ] Step 6: Complete

## .env TEMPLATE (REPLACE INVALID KEY)
```
REACT_APP_FIREBASE_API_KEY=AIzaSyNewValidKeyHere
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-new-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```
1. Firebase Console → New Project or Settings → Config
2. Authentication: Enable Email + Google
3. Authorized domains: `localhost`
4. Restart app

Current: DOM fixed. Config needed for auth.

# MyStoryLand — Personalized Storybooks UAE

## File structure

```
mystoryland/
├── index.html          ← Customer storefront
├── admin.html          ← Admin panel (private)
├── css/
│   ├── style.css       ← Storefront styles
│   └── admin.css       ← Admin styles
└── js/
    ├── storefront.js   ← Storefront logic + order form
    └── admin.js        ← Admin logic, order/book management
```

## Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `mystoryland`)
2. Upload all files maintaining the folder structure above
3. Go to Settings → Pages → Source: main / root → Save
4. Live at: `https://steyes04.github.io/mystoryland/`
   - Storefront: `/mystoryland/`
   - Admin: `/mystoryland/admin.html`

## Admin login
- Username: `admin`
- Password: `admin123`
- ⚠️ Change these in `js/admin.js` before going live

## Connect Supabase
1. Create a project at supabase.com
2. Create an `orders` table with columns:
   - ref (text, primary key)
   - customer_name, phone, address, emirate (text)
   - child_name (text), child_age (int), child_gender (text)
   - book_theme (text), amount (int), status (text)
   - created_at (timestamptz, default now())
3. Replace `YOUR_PROJECT` and `YOUR_ANON_KEY` in both JS files
   OR use the Settings → Supabase section in the admin panel

## Next steps
- [ ] Connect Supabase for real order storage
- [ ] Add Stripe payment
- [ ] Wire WhatsApp notification on new order
- [ ] Add AI generation pipeline (Claude API + DALL·E)
- [ ] Custom domain (mystoryland.ae)

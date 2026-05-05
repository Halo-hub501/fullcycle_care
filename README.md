# FullCycle Property Care — Website

Clean, editable rebuild of fullcyclecare.ca. Static HTML/CSS/JS — no build step, no dependencies. Open `index.html` in a browser to view.

## File map

```
fullcyclecare-site/
├── index.html      Main page (single-page site)
├── styles.css      All styling
├── script.js       Calculator + form logic
└── images/         Drop owner photo + service images here
```

## Quick edits

### Change the owner name
Open `index.html` and find `[OWNER NAME]` (appears twice in the About section). Replace both with the real name.

### Change the founder story
In `index.html`, the About section has a generic founder paragraph. Rewrite it in the owner's own voice — why she started the business, where she lives, what makes FullCycle different.

### Add the owner photo
Drop the photo file into the `images/` folder. Then in `index.html` find the two `<div class="hero-placeholder">` blocks (one in the hero, one in About) and replace each with:

```html
<img src="images/owner.jpg" alt="[Owner name], founder of FullCycle Property Care" />
```

### Change colors
All colors live in `styles.css` at the top under `:root`. Edit these CSS variables:

```css
--green-900: #1f4d33;   /* darkest green — header text, footer bg */
--green-700: #2d7a4f;   /* main green — buttons, links */
--green-500: #4a9b5a;   /* accent green */
--green-50:  #eef7f0;   /* pale green — section backgrounds */
--gold:      #e6b54a;   /* accent gold — logo dot, highlight */
```

Change them once, the whole site updates.

### Change phone or email
Search-and-replace across `index.html`:
- Phone: `437-318-2562` (also appears as `4373182562` in `tel:` links)
- Email: `info@fullcyclecare.ca`

### Add or remove a service
- **HTML:** edit the services grid (`<section id="services">`) and the calculator checkboxes (`<fieldset><legend>Services</legend>`).
- **JS:** edit `BASE_PRICES` at the top of `script.js` to add/remove the price.
- **Form:** add/remove the matching `<option>` in the booking form.

### Adjust calculator pricing
Edit `BASE_PRICES`, `SIZE_MULT`, and `FREQ_MULT` at the top of `script.js`.

```js
const BASE_PRICES = { lawn: 120, leaves: 40, snow: 80 }; // monthly $
const SIZE_MULT   = { small: 0.8, medium: 1.0, large: 1.4 };
const FREQ_MULT   = { weekly: 1.0, biweekly: 0.6 };
```

## Booking form note

Right now the form just shows a confirmation message — it doesn't email anyone. To wire it to a real backend:

- **Easiest:** sign up for [Formspree](https://formspree.io) (free tier), then change the `<form>` opening tag to `<form action="https://formspree.io/f/YOUR_ID" method="POST">` and remove the JS submit handler in `script.js`.
- **If hosting on Netlify:** add `data-netlify="true"` to the `<form>` tag and Netlify auto-collects submissions.

## Deploy

This is plain static HTML — drag the folder into any of these and you're live:

- **Netlify Drop:** https://app.netlify.com/drop (drag-and-drop, free, instant URL)
- **Cloudflare Pages:** connect a GitHub repo or upload directly
- **Vercel:** same idea, drag-and-drop or git
- **Existing host:** if fullcyclecare.ca is already hosted somewhere, upload these three files via FTP / their dashboard

For the `fullcyclecare.ca` domain to point at the new site, update the DNS at your domain registrar to whichever host you pick.

## Things still on the to-do list

- [ ] Replace `[OWNER NAME]` with the real name (2 spots)
- [ ] Add real owner photo (2 spots)
- [ ] Rewrite the founder story in the owner's voice
- [ ] Set up Google Business Profile (single highest-impact thing for a new local business)
- [ ] Pick a host and deploy
- [ ] Wire the booking form to a real backend (Formspree or Netlify Forms) when ready to launch

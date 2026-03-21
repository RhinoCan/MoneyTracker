# Possible next projects

- presentation/exercise for KWJS on i18n/l10n
- better website for WRNPLC?
- bus stop finder combined with "when is next bus?" for K-W
- cheapest gas locator for Canada/US
- sleep diary data collector
- replacement for rec.arts.tv?
- Out of Milk replacement

## WRNPLC

main page => appointment booking page => team/office selection page => name, OHIP number, birth date => provider selection => email and phone no => appointment type and format => choose date and time => confirmation

## Grocery List

Template (Pantry List): A list of regularly purchased items that may or may not be purchased on any given trip to the grocery store. The list could contain simply the name of item, e.g. margarine, with optional details such as quantity or size. The list begins empty and users add one item at a time. At any point, the list can be manually sorted to put it in the order that these things will be found at a given supermarket. That happens via an up-caret and a down-caret on each row. The list has two basic groups of items: food and supplies. Supplies are things that you buy at the grocery store that aren't edible e.g. garbage bags. Each item has a checkbox or toggle in front of it so the user stimply ticks what they want on the next trip. When they are finished, they click a "Hide items not needed" toggle to make unchecked items disappear; when the shopping trip is done, they should click a Reset button to make all items visible again with all checkboxes empty. It should be possible to click on any item in the template and either edit it, delete it, or move it within the list.

This app should be a PWA (Progressive Web App) which Claude describes as follows:

The key technology behind it is a Service Worker — a small JavaScript file that acts as a proxy between your app and the network. On the first visit it caches all the app's assets (HTML, CSS, JavaScript) locally on the device. On every subsequent visit it serves everything from that local cache, with zero network requests.
For a Vue/Vite project the setup is almost trivially easy using a plugin called vite-plugin-pwa. It generates the service worker automatically based on your build output — you just configure it and it handles everything.
The end result for your grocery app would be:

- First visit on home WiFi — app downloads and caches (a few hundred KB at most for a simple app)
- Add to home screen on Android — looks and launches like a native app
- Every subsequent use — completely offline, no network, no data charges, works in the supermarket with no signal

When you're ready to set it up I'll walk you through it. It's probably an hour's work at most for a simple app.


### Future Enhancements to Grocery List

Should multiple templates be possible? That could be useful if the user frequents multiple grocery stores and goes to each for different things.

Provide the ability to assign individual items in the list to a specific person so that the list could be divided betwen family members. For example, Bob goes to the butcher and buys meat; Mary stops at the bakery for bread and desserts; Carol buys the other staples.

Provide Register and Login pages so that multiple users are possible with all data segregated by user (or by family if multiple people in the same household participate in the shopping.)

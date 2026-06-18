# SplashScreen — Integration Guide

## 1. Drop the file
Place `SplashScreen.jsx` inside your components folder:
```
src/components/SplashScreen.jsx
```

## 2. Wire it into App.jsx (or main entry)
```jsx
import { useState } from "react";
import SplashScreen from "./components/SplashScreen";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import POSPage from "./pages/POSPage";
// ...other imports

export default function App() {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return <SplashScreen onComplete={() => setLoaded(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pos"   element={<POSPage />} />
        {/* ...other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

## 3. Optional — show only once per session
```jsx
const [loaded, setLoaded] = useState(
  () => sessionStorage.getItem("splash_shown") === "true"
);

const handleComplete = () => {
  sessionStorage.setItem("splash_shown", "true");
  setLoaded(true);
};

if (!loaded) return <SplashScreen onComplete={handleComplete} />;
```

## 4. Google Fonts (already loaded via @import inside the component)
No extra setup needed — Bebas Neue + Montserrat are injected automatically
when the component mounts. If you prefer to load them in index.html:

```html
<!-- In public/index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;500&display=swap" rel="stylesheet" />
```
Then remove the `@import` line inside the KEYFRAMES constant in SplashScreen.jsx.

## 5. Customise progress speed
Inside the `steps` array in SplashScreen.jsx, each entry is:
```js
{ target: 65, speed: 35 }
//  ^ fill to 65%   ^ ms per 1% increment (lower = faster)
```
Adjust `speed` values to match your real app load time.

## 6. Adjust status messages
Edit the `STATUS_MESSAGES` array at the top of SplashScreen.jsx:
```js
const STATUS_MESSAGES = [
  "Preparing your experience",
  "Loading menu items",
  "Connecting to POS",
  "Syncing orders",
  "Almost ready",
];
```

## What's included
- Radial red ambient glow with pulse animation
- 4 orbit rings (2 solid, 2 dashed) rotating at different speeds
- Ambient particle dots scattered across screen
- Corner bracket frame decoration
- Logo with red accent on first letters + glow text shadow
- Animated divider line expanding on load
- "Point of Sale System" subtitle fading up
- Non-linear progress bar (fast → slow → burst to 100)
- Cycling status messages at progress milestones
- Percentage counter
- Full-screen fade-out transition when complete
- `onComplete` callback for App.jsx to unmount the splash

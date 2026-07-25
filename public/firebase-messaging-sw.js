importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCMx3r2mxvm4ppsP_WRwQk1wpRdDk9XGK4",
  authDomain: "parking-app-fdd8f.firebaseapp.com",
  projectId: "parking-app-fdd8f",
  storageBucket: "parking-app-fdd8f.firebasestorage.app",
  messagingSenderId: "114804433021",
  appId: "1:114804433021:web:baaba1458e7acaf571d114",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "SmartPark";
  const body = payload.notification?.body ?? "";
  const data = payload.data ?? {};

  self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data,
    tag: data.type ?? "smartpark",
  });
});

// Handle notification click — open app and navigate
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data ?? {};
  const bookingId = data.booking_id;

  let url = "/";
  if (bookingId) {
    url = `/#/bookings/${bookingId}`;
  } else {
    url = "/#/notifications";
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});

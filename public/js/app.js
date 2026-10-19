/**
 * REVORA Global State & Client Helper Library
 * Connect Resources. Create Opportunities.
 */

const API_BASE = '/api';

const RevoraApp = {
  // Authentication State
  getToken() {
    return localStorage.getItem('revora_token');
  },

  getUser() {
    try {
      const u = localStorage.getItem('revora_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user, token) {
    if (token) localStorage.setItem('revora_token', token);
    if (user) localStorage.setItem('revora_user', JSON.stringify(user));
    this.updateNavAuth();
  },

  logout() {
    localStorage.removeItem('revora_token');
    localStorage.removeItem('revora_user');
    window.location.href = '/index.html';
  },

  // API Client with automatic Auth header
  async fetchApi(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `Server returned error (${response.status})`);
        }
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Toast notification system
  showToast(message, type = 'success') {
    let container = document.getElementById('revora-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'revora-toast-container';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'warning' ? 'warning text-dark' : 'success'} border-0 shadow-lg`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body fw-semibold">
          <i class="bi ${type === 'error' ? 'bi-exclamation-triangle-fill' : type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  },

  // Shopping Cart Management
  getCart() {
    try {
      const c = localStorage.getItem('revora_cart');
      return c ? JSON.parse(c) : [];
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem('revora_cart', JSON.stringify(cart));
    this.updateCartBadge();
  },

  addToCart(product, quantity = 1) {
    let cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.product_id === product.id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += Number(quantity);
    } else {
      cart.push({
        product_id: product.id,
        title: product.title,
        unit: product.unit,
        price_per_unit: product.price_per_unit,
        image: product.images && product.images[0] ? product.images[0] : '',
        quantity: Number(quantity),
        farmer_name: product.farmer_name,
        available_stock: product.available_stock
      });
    }

    this.saveCart(cart);
    this.showToast(`Added ${quantity} ${product.unit} of "${product.title}" to cart!`);
  },

  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.product_id !== productId);
    this.saveCart(cart);
  },

  clearCart() {
    localStorage.removeItem('revora_cart');
    this.updateCartBadge();
  },

  updateCartBadge() {
    const cart = this.getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge-count');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-block' : 'none';
    });
  },

  // Location Management
  getLocation() {
    const saved = localStorage.getItem('revora_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.town || 'Bhimavaram (Live)';
      } catch (e) {
        return saved;
      }
    }
    return 'Bhimavaram (Live)';
  },

  setLocation(town, isGPS = false) {
    const locObj = {
      town: town,
      isGPS: isGPS,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('revora_location', JSON.stringify(locObj));

    // Update all location labels on page
    const navText = document.getElementById('navLiveLocationText');
    if (navText) navText.innerText = town + (isGPS ? ' (GPS)' : '');
    const globalNav = document.getElementById('globalNavLocation');
    if (globalNav) globalNav.innerText = town + (isGPS ? ' (GPS)' : '');

    // Dispatch location change event
    window.dispatchEvent(new CustomEvent('revora:locationChanged', { detail: locObj }));
    this.showToast(`Location set to: ${town}${isGPS ? ' via GPS' : ''}`, 'success');
  },

  detectGPS() {
    if (!navigator.geolocation) {
      this.showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }

    this.showToast('Acquiring satellite GPS position...', 'warning');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Approximate nearest Godavari Delta town or general AP district
        let nearestTown = 'Bhimavaram';
        if (lat >= 16.50 && lat <= 16.58 && lon >= 81.48 && lon <= 81.56) {
          nearestTown = 'Bhimavaram';
        } else if (lat >= 16.48 && lat <= 16.56 && lon >= 81.68 && lon <= 81.76) {
          nearestTown = 'Palakollu';
        } else if (lat >= 16.56 && lat <= 16.64 && lon >= 81.42 && lon <= 81.50) {
          nearestTown = 'Undi';
        } else if (lat >= 16.78 && lat <= 16.86 && lon >= 81.48 && lon <= 81.56) {
          nearestTown = 'Tadepalligudem';
        } else if (lat >= 16.72 && lat <= 16.80 && lon >= 81.65 && lon <= 81.73) {
          nearestTown = 'Tanuku';
        } else if (lat >= 16.40 && lat <= 16.48 && lon >= 81.65 && lon <= 81.73) {
          nearestTown = 'Narasapuram';
        } else if (lat >= 16.68 && lat <= 16.74 && lon >= 81.08 && lon <= 81.14) {
          nearestTown = 'Eluru';
        } else if (lat >= 16.96 && lat <= 17.04 && lon >= 81.74 && lon <= 81.82) {
          nearestTown = 'Rajahmundry';
        } else if (lat >= 16.48 && lat <= 16.54 && lon >= 80.60 && lon <= 80.68) {
          nearestTown = 'Vijayawada';
        } else {
          nearestTown = `Bhimavaram Hub (${lat.toFixed(2)}°N)`;
        }

        this.setLocation(nearestTown, true);
        const modalEl = document.getElementById('revoraGlobalLocationModal');
        if (modalEl) {
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
        }
      },
      (error) => {
        console.warn('GPS location error:', error);
        // Fallback gracefully
        this.showToast('GPS permission denied or unavailable. Selected default: Bhimavaram', 'warning');
        this.setLocation('Bhimavaram');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  },

  openLocationModal() {
    let modalEl = document.getElementById('revoraGlobalLocationModal');
    if (!modalEl) {
      const modalHTML = `
        <div class="modal fade" id="revoraGlobalLocationModal" tabindex="-1" aria-labelledby="revoraLocModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
              <div class="modal-header bg-revora-forest text-white" style="background: #123d2c;">
                <h5 class="modal-title fw-bold" id="revoraLocModalLabel">
                  <i class="bi bi-geo-alt-fill text-danger me-2"></i> Select Your Location / పట్టణం
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body p-4">
                <div class="d-grid mb-3">
                  <button class="btn btn-success py-2.5 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" onclick="RevoraApp.detectGPS()">
                    <i class="bi bi-crosshair fs-5"></i> Detect My Live GPS Location (లైవ్ లొకేషన్)
                  </button>
                </div>
                
                <div class="text-center text-muted small my-3 position-relative">
                  <span class="bg-white px-2 fw-semibold">or select your local Godavari / AP town</span>
                </div>

                <div class="d-flex flex-wrap gap-2 mb-4 justify-content-center">
                  <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5" onclick="RevoraApp.selectModalTown('Bhimavaram')">📍 Bhimavaram (భీమవరం)</button>
                  <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5" onclick="RevoraApp.selectModalTown('Palakollu')">📍 Palakollu (పాలకొల్లు)</button>
                  <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5" onclick="RevoraApp.selectModalTown('Undi')">📍 Undi (ఉండి)</button>
                  <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5" onclick="RevoraApp.selectModalTown('Tadepalligudem')">📍 Tadepalligudem (తాడేపల్లిగూడెం)</button>
                  <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5" onclick="RevoraApp.selectModalTown('Tanuku')">📍 Tanuku (తణుకు)</button>
                  <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5" onclick="RevoraApp.selectModalTown('Narasapuram')">📍 Narasapuram (నరసాపురం)</button>
                  <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5" onclick="RevoraApp.selectModalTown('Eluru')">📍 Eluru (ఏలూరు)</button>
                  <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5" onclick="RevoraApp.selectModalTown('Rajahmundry')">📍 Rajahmundry (రాజమండ్రి)</button>
                  <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5" onclick="RevoraApp.selectModalTown('Vijayawada')">📍 Vijayawada (విజయవాడ)</button>
                </div>

                <div class="input-group">
                  <input type="text" id="modalCustomTownInput" class="form-control rounded-start-pill ps-3" placeholder="Enter other town or PIN Code...">
                  <button class="btn btn-revora-primary rounded-end-pill px-4" onclick="RevoraApp.saveCustomTown()">Set Town</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      modalEl = document.getElementById('revoraGlobalLocationModal');
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  },

  selectModalTown(town) {
    this.setLocation(town, false);
    const modalEl = document.getElementById('revoraGlobalLocationModal');
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    }
  },

  saveCustomTown() {
    const input = document.getElementById('modalCustomTownInput');
    if (input && input.value.trim()) {
      this.setLocation(input.value.trim(), false);
      const modalEl = document.getElementById('revoraGlobalLocationModal');
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }
    }
  },

  // Navigation UI sync
  updateNavAuth() {
    const user = this.getUser();
    const authLinks = document.getElementById('navbar-auth-links');
    if (!authLinks) return;

    if (user) {
      authLinks.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-sm btn-light dropdown-toggle d-flex align-items-center gap-2 border-0 bg-transparent py-1" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <span class="rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 28px; height: 28px; background: #e8f1c7; color: #123d2c; font-weight: bold; font-size: 0.8rem;">
              ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
            <span class="d-none d-sm-inline fw-bold small">${user.name.split(' ')[0]}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="userDropdown">
            <li><div class="dropdown-header text-muted small">Signed in as <strong>${user.name}</strong></div></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="/dashboard.html"><i class="bi bi-grid-fill me-2 text-revora-forest"></i>Dashboard</a></li>
            <li><a class="dropdown-item" href="/dashboard.html?tab=rentals"><i class="bi bi-calendar-check me-2"></i>My Rentals</a></li>
            <li><a class="dropdown-item" href="/dashboard.html?tab=orders"><i class="bi bi-basket3 me-2"></i>My Orders</a></li>
            <li><a class="dropdown-item" href="/dashboard.html?tab=service-bookings"><i class="bi bi-tools me-2"></i>My Service Bookings</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="RevoraApp.logout()"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</a></li>
          </ul>
        </div>
      `;
    } else {
      authLinks.innerHTML = `
        <a class="login-button" href="/auth.html?mode=login">Log in</a>
        <a class="primary-button small" href="/auth.html?mode=register">Get started <span>↗</span></a>
      `;
    }
  },

  // REVORA Branded Preloader Animation
  initPreloader() {
    let preloader = document.getElementById('revoraPreloader');
    if (!preloader) {
      const html = `
        <div id="revoraPreloader" class="revora-preloader" aria-label="Loading REVORA...">
          <div class="preloader-content text-center">
            <div class="preloader-logo-wrap">
              <div class="preloader-glow-ring"></div>
              <div class="preloader-orbit-ring"><div class="orbit-dot"></div></div>
              <div class="preloader-logo-card">
                <img src="/images/revora_logo.png" alt="REVORA" class="preloader-logo-img" onerror="this.onerror=null; this.src='/image_5dd721.jpg';">
              </div>
            </div>
            <div class="preloader-brand-title">
              REV<span class="leaf-accent"><i class="bi bi-flower1"></i></span>RA
            </div>
            <div class="preloader-tagline">
              Connect Resources • Create Opportunities
            </div>
            <div class="preloader-progress-container">
              <div class="preloader-progress-bar" id="preloaderProgressBar"></div>
            </div>
            <div class="preloader-status-text" id="preloaderStatusText">
              Connecting local community<span class="loading-dots">...</span>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('afterbegin', html);
      preloader = document.getElementById('revoraPreloader');
    }

    if (preloader.dataset.initialized === 'true') return;
    preloader.dataset.initialized = 'true';

    const bar = document.getElementById('preloaderProgressBar');
    const statusText = document.getElementById('preloaderStatusText');

    let progress = 20;
    if (bar) bar.style.width = '20%';

    const progressInterval = setInterval(() => {
      if (progress < 85) {
        progress += Math.floor(Math.random() * 12) + 8;
        if (progress > 88) progress = 88;
        if (bar) bar.style.width = `${progress}%`;
      }
    }, 120);

    const statuses = [
      "Connecting local community...",
      "Discovering fresh farm produce...",
      "Syncing equipment & tools...",
      "Preparing verified services..."
    ];
    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      statusIdx = (statusIdx + 1) % statuses.length;
      if (statusText) statusText.innerHTML = `${statuses[statusIdx]}<span class="loading-dots">...</span>`;
    }, 320);

    let dismissed = false;
    const dismissPreloader = () => {
      if (dismissed) return;
      dismissed = true;
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      if (bar) bar.style.width = '100%';
      if (statusText) statusText.innerHTML = 'Welcome to REVORA!';
      setTimeout(() => {
        if (preloader) {
          preloader.classList.add('fade-out');
          setTimeout(() => {
            preloader.style.display = 'none';
          }, 600);
        }
      }, 250);
    };

    if (document.readyState === 'complete') {
      setTimeout(dismissPreloader, 600);
    } else {
      window.addEventListener('load', () => setTimeout(dismissPreloader, 450));
    }

    // Failsafe timeout
    setTimeout(dismissPreloader, 2000);
  },

  // Setup Global Header & Footer Components
  renderNavbar(activePage = 'home') {
    this.initPreloader();
    const navPlaceholder = document.getElementById('revora-header-container');
    if (!navPlaceholder) return;

    const currentLoc = this.getLocation();

    navPlaceholder.innerHTML = `
      <div class="announcement">
        <span class="announcement-dot"></span> A better way to grow, share and thrive in Bhimavaram
        <a href="/marketplace.html">Explore marketplace <span>↗</span></a>
      </div>
      <header class="site-header">
        <a class="brand" href="/index.html" aria-label="REVORA home">
          <img src="/images/revora_logo.png" alt="REVORA Logo" style="height: 38px; width: auto; object-fit: contain;" onerror="this.onerror=null; this.src='/image_5dd721.jpg';">
          <span>revora<span class="brand-period">.</span></span>
        </a>

        <nav class="desktop-nav" aria-label="Main navigation">
          <a class="${activePage === 'home' ? 'active' : ''}" href="/index.html">Home</a>
          <a class="${activePage === 'farm-equipment' ? 'active' : ''}" href="/farm-equipment.html">Farm Equipment</a>
          <a class="${activePage === 'marketplace' ? 'active' : ''}" href="/marketplace.html">Fresh Produce</a>
          <a class="${activePage === 'resource-sharing' ? 'active' : ''}" href="/resource-sharing.html">Tool Sharing</a>
          <a class="${activePage === 'home-services' ? 'active' : ''}" href="/home-services.html">Services</a>

        </nav>

        <div class="header-actions d-flex align-items-center gap-2">
          <!-- Live Location Capsule -->
          <button class="btn btn-sm btn-light border rounded-pill d-flex align-items-center gap-1 px-2.5 py-1 shadow-sm" onclick="RevoraApp.openLocationModal()" title="Click to detect or change live location">
            <span class="location-pulse-dot"></span>
            <i class="bi bi-geo-alt-fill text-danger small"></i>
            <span class="small fw-bold text-truncate" style="max-width: 130px;" id="globalNavLocation">${currentLoc}</span>
            <i class="bi bi-chevron-down text-muted" style="font-size: 0.65rem;"></i>
          </button>

          <a href="/marketplace.html#cart" class="btn btn-sm btn-light position-relative p-2" aria-label="Cart" title="Cart">
            <i class="bi bi-bag text-revora-forest fs-6"></i>
            <span class="badge-cart-count cart-badge-count" style="display:none;">0</span>
          </a>

          <div id="navbar-auth-links" class="d-flex align-items-center gap-2">
            <!-- Dynamically populated -->
          </div>

          <button class="menu-toggle btn btn-sm d-lg-none" id="menuToggle" aria-label="Toggle navigation" onclick="document.querySelector('.desktop-nav').classList.toggle('open')">
            ☰
          </button>
        </div>
      </header>
    `;

    this.updateNavAuth();
    this.updateCartBadge();
  },

  renderFooter(activePage = 'home') {
    const footerPlaceholder = document.getElementById('revora-footer-container');
    if (!footerPlaceholder) return;

    footerPlaceholder.innerHTML = `
      <footer class="site-footer">
        <a class="brand footer-brand" href="/index.html">
          <img src="/images/revora_logo.png" alt="REVORA" style="height: 32px; width: auto; object-fit: contain;" onerror="this.onerror=null; this.src='/image_5dd721.jpg';">
          <span>revora<span class="brand-period">.</span></span>
        </a>
        <p>Good things grow when we grow together. Connect Resources. Create Opportunities in Bhimavaram and beyond.</p>
        <div class="footer-links">
          <a href="/farm-equipment.html">Farm Equipment</a>
          <a href="/marketplace.html">Produce Marketplace</a>
          <a href="/resource-sharing.html">Tool Sharing</a>
          <a href="/home-services.html">Home Services</a>
          <a href="/dashboard.html">Dashboard</a>
        </div>
        <small>© ${new Date().getFullYear()} REVORA. Built for shared growth in Andhra Pradesh.</small>
      </footer>

      <!-- Mobile Sticky Bottom Navigation -->
      <nav class="mobile-bottom-nav d-lg-none">
        <a href="/index.html" class="mobile-nav-item ${activePage === 'home' ? 'active' : ''}">
          <i class="bi bi-house"></i>
          <span>Home</span>
        </a>
        <a href="/farm-equipment.html" class="mobile-nav-item ${activePage === 'farm-equipment' ? 'active' : ''}">
          <i class="bi bi-truck"></i>
          <span>Tractors</span>
        </a>
        <a href="/marketplace.html" class="mobile-nav-item ${activePage === 'marketplace' ? 'active' : ''}">
          <i class="bi bi-basket"></i>
          <span>Fresh</span>
        </a>
        <a href="/home-services.html" class="mobile-nav-item ${activePage === 'home-services' ? 'active' : ''}">
          <i class="bi bi-wrench-adjustable"></i>
          <span>Services</span>
        </a>
        <a href="/dashboard.html" class="mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <i class="bi bi-person-circle"></i>
          <span>Account</span>
        </a>
      </nav>
    `;
  }
};

window.RevoraApp = RevoraApp;

// Auto-run preloader across all pages
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.RevoraApp && RevoraApp.initPreloader) {
        RevoraApp.initPreloader();
      }
    });
  } else {
    setTimeout(() => {
      if (window.RevoraApp && RevoraApp.initPreloader) {
        RevoraApp.initPreloader();
      }
    }, 10);
  }
}


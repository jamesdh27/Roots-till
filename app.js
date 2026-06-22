// Global Error Catching for Error Boundary UI
        window.onerror = function(message, source, lineno, colno, error) {
            const boundary = document.getElementById('error-boundary');
            const boundaryMsg = document.getElementById('error-boundary-msg');
            if (boundary && boundaryMsg) {
                boundary.classList.remove('hidden');
                boundaryMsg.textContent = `${message}\nat ${source}:${lineno}:${colno}\n\nStack:\n${error ? error.stack : 'N/A'}`;
            }
            return false;
        };
        window.onunhandledrejection = function(event) {
            const boundary = document.getElementById('error-boundary');
            const boundaryMsg = document.getElementById('error-boundary-msg');
            if (boundary && boundaryMsg) {
                boundary.classList.remove('hidden');
                boundaryMsg.textContent = `Unhandled Promise Rejection: ${event.reason}\n\nStack:\n${event.reason ? event.reason.stack : 'N/A'}`;
            }
        };

        // ==========================================
        // CONFIGURATION, STATE & DATASETS
        // ==========================================
        const DASHBOARD_PIN = "7866";
        const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSntl3rIlimUrEI6rPybWhuAlWfghicgkovf1GgcgaeGbwaSDYPr0zMATu-4AKoBE9RMqE4whk8L4cy/pub?gid=0&single=true&output=csv";

        let salesData = [];
        let productMetrics = {};
        let currentProductTab = 'top';
        let peakChart = null;
        let activeFilteredSales = [];
        let productSortColumn = 'revenue';
        let productSortAsc = false;
        let activeReviewTag = null;
        let activeChartView = 'hourly';

        let GUEST_REVIEWS = [];

        /**
         * Fetches the dynamic reviews harvested by our python automation routine.
         */
        async function loadDynamicReviews() {
            try {
                const response = await fetch('reviews_data.json');
                if (!response.ok) throw new Error('Reviews data asset missing or unreachable.');
                
                GUEST_REVIEWS = await response.json();
                
                // Dynamically update sentiment counts if GUEST_REVIEWS contains tags
                if (window.SENTIMENT_WORDS) {
                    SENTIMENT_WORDS.forEach(sw => {
                        const wordCount = GUEST_REVIEWS.filter(r => r.tags && r.tags.includes(sw.word)).length;
                        sw.count = wordCount;
                    });
                }
                
                console.log("ðŸ’¬ Dynamic reviews successfully loaded:", GUEST_REVIEWS);

            } catch (error) {
                console.warn("âš ï¸ Dynamic reviews fetch error. Using static fallbacks.", error);
                GUEST_REVIEWS = [
                    {
                        author: "Sarah M.",
                        rating: 5,
                        source: "Google",
                        date: "2026-06-12",
                        text: "The jerk chicken was absolutely phenomenal! Fall-off-the-bone tender and packed with spice. Best Caribbean spot in Hull by far. Great reggae music too.",
                        tags: ["food", "service", "vibe"]
                    },
                    {
                        author: "David K.",
                        rating: 5,
                        source: "TripAdvisor",
                        date: "2026-06-11",
                        text: "Incredible Reggae Rum Punch! Tastes just like the Caribbean. Staff were super friendly and the cocktails are fantastic value. We will definitely be back.",
                        tags: ["drinks", "service", "vibe"]
                    },
                    {
                        author: "Liam T.",
                        rating: 4,
                        source: "Google",
                        date: "2026-06-10",
                        text: "Really delicious curried mutton and plantain. The cocktails are strong and tasty. It gets busy on weekends so service can be a bit slow, but worth the wait.",
                        tags: ["food", "service", "drinks", "slow"]
                    },
                    {
                        author: "Emma L.",
                        rating: 5,
                        source: "Google",
                        date: "2026-06-08",
                        text: "Amazing atmosphere! Love the tropical styling and the playlist is excellent. Red Stripe on draught is perfect. The Mac & Cheese balls are a must-try.",
                        tags: ["vibe", "drinks", "food"]
                    },
                    {
                        author: "Marcus J.",
                        rating: 4,
                        source: "TripAdvisor",
                        date: "2026-06-05",
                        text: "Great food and cocktails. Jerk pork wraps are very tasty. Larkins next door is cheaper for pints, but Roots has way better flavor and vibe.",
                        tags: ["food", "value", "vibe"]
                    }
                ];
            }
        }

        const SENTIMENT_WORDS = [
            { word: "food", count: 28, sentiment: "positive", score: "+88%" },
            { word: "service", count: 18, sentiment: "positive", score: "+75%" },
            { word: "drinks", count: 22, sentiment: "positive", score: "+92%" },
            { word: "vibe", count: 15, sentiment: "positive", score: "+95%" },
            { word: "cocktails", count: 19, sentiment: "positive", score: "+90%" },
            { word: "value", count: 12, sentiment: "positive", score: "+80%" },
            { word: "slow", count: 6, sentiment: "negative", score: "-40%" }
        ];



        // Competitor menu items comparison dataset
        let COMPETITOR_MENUS = [];

        /**
         * Fetches the automated street intelligence pricing data and transforms
         * the venue-first JSON matrix back into flat benchmark rows.
         */
        async function loadDynamicStreetIntelligence() {
            try {
                const response = await fetch('street_data.json');
                if (!response.ok) throw new Error('Street data asset missing or unreachable.');
                
                const scrapedData = await response.json();
                
                // Hardcoded baseline menu configuration mapping to match existing layout keys
                const menuTemplate = [
                    { name: "Reggae Rum Punch", category: "Cocktails", roots: 9.75, targetKey: "Rum Punch" },
                    { name: "Flamin Zombie", category: "Cocktails", roots: 10.00, targetKey: "Zombie" },
                    { name: "Pina Colada", category: "Cocktails", roots: 9.75, targetKey: "Pina Colada" },
                    { name: "Red Stripe Pint", category: "Draught Beer", roots: 6.50, targetKey: "Red Stripe" },
                    { name: "Cruz Campo Pint", category: "Draught Beer", roots: 5.50, targetKey: "Cruz Campo" },
                    { name: "Corona Bottle", category: "Bottles", roots: 5.00, targetKey: "Corona" },
                    { name: "Trinidadian Jerk Chicken", category: "Mains", roots: 16.00, targetKey: "Jerk Chicken" },
                    { name: "Mo Bay Chicken Curry", category: "Mains", roots: 17.00, targetKey: "Curry Chicken" },
                    { name: "Mac & Cheese Balls", category: "Lite Bites", roots: 8.00, targetKey: "Mac & Cheese" },
                    { name: "Belly Pork Bites", category: "Lite Bites", roots: 8.00, targetKey: "Belly Pork" },
                    { name: "Roots Diet Coke", category: "Soft Drinks", roots: 3.50, targetKey: "Diet Coke" }
                ];

                // Remap venue-first scraped object variables back to tabular metrics
                COMPETITOR_MENUS = menuTemplate.map(item => {
                    return {
                        name: item.name,
                        category: item.category,
                        roots: item.roots,
                        larkins: scrapedData["The Larkins"]?.[item.targetKey] || null,
                        piper: scrapedData["The Piper"]?.[item.targetKey] || null,
                        boardwalk: scrapedData["Boardwalk"]?.[item.targetKey] || null,
                        xanadu: scrapedData["Xanadu Lounge"]?.[item.targetKey] || null
                    };
                });

                console.log("ðŸ“Š Dynamic street matrix successfully parsed:", COMPETITOR_MENUS);

            } catch (error) {
                console.warn("âš ï¸ Automated feed error. Initializing static hardcoded fail-safes.", error);
                // Fallback array declaration to prevent layout breakage if scraper fails
                COMPETITOR_MENUS = [
                    { name: "Reggae Rum Punch", category: "Cocktails", roots: 9.75, larkins: 8.50, piper: 8.00, boardwalk: 9.50, xanadu: 10.75 },
                    { name: "Flamin Zombie", category: "Cocktails", roots: 10.00, larkins: 9.00, piper: 8.50, boardwalk: 10.00, xanadu: 11.50 },
                    { name: "Pina Colada", category: "Cocktails", roots: 9.75, larkins: 8.50, piper: 8.00, boardwalk: 9.50, xanadu: 10.25 },
                    { name: "Red Stripe Pint", category: "Draught Beer", roots: 6.50, larkins: 5.20, piper: 5.00, boardwalk: 5.80, xanadu: 6.20 },
                    { name: "Cruz Campo Pint", category: "Draught Beer", roots: 5.50, larkins: 4.80, piper: 4.50, boardwalk: 5.20, xanadu: 5.60 },
                    { name: "Corona Bottle", category: "Bottles", roots: 5.00, larkins: 4.20, piper: 4.00, boardwalk: 4.80, xanadu: 5.00 },
                    { name: "Trinidadian Jerk Chicken", category: "Mains", roots: 16.00, larkins: 13.50, piper: 12.00, boardwalk: 15.00, xanadu: null },
                    { name: "Mo Bay Chicken Curry", category: "Mains", roots: 17.00, larkins: 14.50, piper: 13.00, boardwalk: 15.50, xanadu: null },
                    { name: "Mac & Cheese Balls", category: "Lite Bites", roots: 8.00, larkins: 6.50, piper: 5.50, boardwalk: 7.50, xanadu: 8.50 },
                    { name: "Belly Pork Bites", category: "Lite Bites", roots: 8.00, larkins: 7.00, piper: 6.00, boardwalk: 7.50, xanadu: 9.00 },
                    { name: "Roots Diet Coke", category: "Soft Drinks", roots: 3.50, larkins: 3.00, piper: 2.80, boardwalk: 3.20, xanadu: 3.80 }
                ];
            }
        }

        // Competitor active street offers feed
        const COMPETITOR_OFFERS = [
            {
                venue: "The Larkins",
                offer: "2-for-1 Cocktails (Sun to Thu, 5pm - 8pm)",
                details: "Includes classic and house cocktails. Highly popular with students from local houses.",
                threat: "High",
                counter: "Run a 'Pitcher Share' special (e.g. 1L Rum Punch Pitcher for Â£16) to encourage group sharing trade."
            },
            {
                venue: "The Piper",
                offer: "Â£4.00 Cruz Campo Pints on Rugby Match Days",
                details: "Runs during all Hull FC & Hull KR televised and local stadium match sessions.",
                threat: "High",
                counter: "Offer a 'Burger & Pint' bundle for Â£18 during game windows to pull dining footfall."
            },
            {
                venue: "Boardwalk",
                offer: "Student 20% Discount (Every Mon and Tue)",
                details: "Applicable on all craft beer cans and street food mains. Requires valid student ID card.",
                threat: "Medium",
                counter: "Promote a 'Roots Mid-Week Jerk Platter' deal with a complimentary soft drink for students."
            },
            {
                venue: "Xanadu Lounge",
                offer: "Happy Hour Â£6.50 Mojitos & Martinis (Daily 4pm - 7pm)",
                details: "Upscale cocktail crowd target. Overlaps with early evening after-work drinks.",
                threat: "Medium",
                counter: "Highlight Roots' premium signature Jamaican rums and play smooth reggae vibes during pre-dinner slots."
            }
        ];

        // ==========================================
        // 1. LOGIN OVERLAY MECHANICS
        // ==========================================
        function checkLogin() {
            const pinInput = document.getElementById('pin-input').value;
            const errorMsg = document.getElementById('login-error');
            
            if (pinInput === DASHBOARD_PIN) {
                document.getElementById('login-overlay').classList.add('hidden');
                document.getElementById('dashboard-wrapper').classList.remove('hidden');
                initDashboard();
            } else {
                errorMsg.textContent = "âŒ Invalid PIN. Try again.";
            }
        }

        // Enter Key Support for Login
        document.getElementById('pin-input')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') checkLogin();
        });

        // Auto-login via query parameter for testing/headless execution
        window.onload = function() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Populate debug fields dynamically if in test mode
            if (urlParams.get('test_action')) {
                const debugOverlay = document.getElementById('debug-overlay');
                if (debugOverlay) debugOverlay.classList.remove('hidden');
                const debugSearch = document.getElementById('debug-search');
                const debugAction = document.getElementById('debug-action');
                if (debugSearch) debugSearch.textContent = window.location.search;
                if (debugAction) debugAction.textContent = urlParams.get('test_action');
            }
            
            if (urlParams.get('bypass') === DASHBOARD_PIN) {
                document.getElementById('login-overlay').classList.add('hidden');
                document.getElementById('dashboard-wrapper').classList.remove('hidden');
                initDashboard();
            }
        };

        // ==========================================
        // 2. DASHBOARD NAVIGATION & LAYOUT CONTROLS
        // ==========================================
        function toggleSidebar(state) {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            
            if (state === undefined) {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            } else if (state) {
                sidebar.classList.add('active');
                overlay.classList.add('active');
            } else {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        }

        function switchTab(tabId) {
            // Hide all tab containers
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            // Show selected tab container
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');
            
            // Update menu sidebar highlighting
            document.querySelectorAll('.menu a').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.getElementById(`menu-${tabId}`);
            if (activeLink) activeLink.classList.add('active');
            
            // Close sidebar on mobile drawer after clicking
            toggleSidebar(false);
        }

        function drillToProduct(productName) {
            if (!productName) return;
            switchTab('product-performance');
            
            const searchInput = document.getElementById('product-search');
            if (searchInput) {
                searchInput.value = productName;
            }
            
            const catFilter = document.getElementById('product-category-filter');
            if (catFilter) catFilter.value = 'all';
            
            const daypartFilter = document.getElementById('product-daypart-filter');
            if (daypartFilter) daypartFilter.value = 'all';
            
            const weatherFilter = document.getElementById('product-weather-filter');
            if (weatherFilter) weatherFilter.value = 'all';
            
            const groupingFilter = document.getElementById('product-grouping-filter');
            if (groupingFilter) groupingFilter.value = 'none';
            
            renderExtendedProductTab();
        }

        function scrollToChartView() {
            changeChartView('daily');
            const chartEl = document.getElementById('peakTimesChart');
            if (chartEl) {
                chartEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // ==========================================
        // 3. INITIALIZATION & SYNC PIPELINES
        // ==========================================
        async function initDashboard() {
            fetchLiveHullWeather();
            await loadDynamicStreetIntelligence();
            await loadDynamicReviews();

            const syncStatus = document.getElementById('sync-status');
            const offlineAlert = document.getElementById('offline-alert');
            const debugOverlay = document.getElementById('debug-overlay');
            const debugRows = document.getElementById('debug-rows');

            try {
                const response = await fetch(`${SHEET_CSV_URL}&t=${Date.now()}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const csvText = await response.text();
                parseCSV(csvText);
                
                // Hide offline alert on success
                if (offlineAlert) offlineAlert.classList.add('hidden');
                
                // Update status pill
                if (syncStatus) {
                    syncStatus.className = 'sync-status-pill success';
                    syncStatus.innerHTML = `ðŸŸ¢ Live Data Loaded (${salesData.length.toLocaleString()} rows)`;
                }
                
                // Update debug rows
                if (debugRows) debugRows.textContent = salesData.length;
                if (debugOverlay && new URLSearchParams(window.location.search).get('test_action')) {
                    debugOverlay.classList.remove('hidden');
                }

                // Auto-set date picker to the latest date available in the dataset (June 14, 2026)
                const latestDate = getLatestTransactionDate();
                document.getElementById('date-start').value = latestDate;
                document.getElementById('date-end').value = latestDate;
                
                // Apply test actions synchronously if query parameter exists
                const urlParams = new URLSearchParams(window.location.search);
                const action = urlParams.get('test_action');
                if (action) {
                    if (action === 'click_low') {
                        currentProductTab = 'low';
                        const btnTop = document.getElementById('btn-product-top');
                        const btnLow = document.getElementById('btn-product-low');
                        if (btnTop && btnLow) {
                            btnTop.classList.remove('active');
                            btnLow.classList.add('active');
                        }
                    } else if (action === 'show_products') {
                        switchTab('product-performance');
                    } else if (action === 'show_products_grouped') {
                        switchTab('product-performance');
                        const grp = document.getElementById('product-grouping-filter');
                        if (grp) grp.value = 'category';
                    } else if (action === 'show_weather') {
                        switchTab('weather-trends');
                    } else if (action === 'show_competitors') {
                        switchTab('competitor-watch');
                    } else if (action === 'show_reviews') {
                        switchTab('reviews-socials');
                    } else if (action === 'show_daily_chart') {
                        switchTab('daily-takings');
                        changeChartView('daily');
                    } else if (action === 'show_dayofweek_chart') {
                        switchTab('daily-takings');
                        changeChartView('dayofweek');
                    } else if (action === 'open_drawer') {
                        toggleSidebar(true);
                    } else if (action === 'drill_drink') {
                        drillToProduct('Reggae Rum Punch');
                    } else if (action === 'test_no_data') {
                        document.getElementById('date-start').value = '2026-06-15';
                        document.getElementById('date-end').value = '2026-06-15';
                    } else if (action === 'test_range_7d') {
                        applyPreset('7d');
                        return; // applyPreset will run processAndRender
                    } else if (action === 'test_compare_active') {
                        document.getElementById('compare-toggle').checked = true;
                        applyPreset('7d');
                        return;
                    } else if (action === 'test_compare_insights') {
                        document.getElementById('compare-toggle').checked = true;
                        switchTab('weather-trends');
                        applyPreset('7d');
                        return;
                    }
                }
                
                processAndRender();
            } catch (error) {
                console.error("Error loading live sheet data:", error);
                
                // Show offline fallback alert
                if (offlineAlert) offlineAlert.classList.remove('hidden');
                
                // Update status pill to error
                if (syncStatus) {
                    syncStatus.className = 'sync-status-pill error';
                    syncStatus.innerHTML = `ðŸ”´ CORS / Connection Block`;
                }
                
                document.getElementById('product-list').innerHTML = "<li>âš ï¸ Live data load failed. Click the button above to load local sample data fallback.</li>";
                
                // Apply test action in catch block for testing sample data fallback
                const urlParams = new URLSearchParams(window.location.search);
                const action = urlParams.get('test_action');
                if (action) {
                    loadSampleDataFallback();
                    if (action === 'show_competitors') {
                        switchTab('competitor-watch');
                    } else if (action === 'show_reviews') {
                        switchTab('reviews-socials');
                    } else if (action === 'show_products') {
                        switchTab('product-performance');
                    } else if (action === 'show_products_grouped') {
                        switchTab('product-performance');
                        const grp = document.getElementById('product-grouping-filter');
                        if (grp) grp.value = 'category';
                        renderExtendedProductTab();
                    } else if (action === 'show_weather') {
                        switchTab('weather-trends');
                    } else if (action === 'show_daily_chart') {
                        switchTab('daily-takings');
                        changeChartView('daily');
                    } else if (action === 'show_dayofweek_chart') {
                        switchTab('daily-takings');
                        changeChartView('dayofweek');
                    } else if (action === 'open_drawer') {
                        toggleSidebar(true);
                    } else if (action === 'drill_drink') {
                        drillToProduct('Reggae Rum Punch');
                    }
                    return;
                }
                
                processAndRender();
            }
        }

        async function handleSync() {
            const syncBtn = document.getElementById('sync-btn');
            const syncIcon = document.getElementById('sync-icon');
            const syncText = document.getElementById('sync-text');
            const syncStatus = document.getElementById('sync-status');
            const offlineAlert = document.getElementById('offline-alert');
            const debugRows = document.getElementById('debug-rows');
            
            // UI Loading State (Disable buttons, add spinner classes)
            syncBtn.disabled = true;
            syncIcon.classList.add('spinning-icon');
            syncText.textContent = "Syncing...";
            if (syncStatus) {
                syncStatus.className = 'sync-status-pill loading-pulse';
                syncStatus.innerHTML = `ðŸ”„ Syncing till...`;
            }
            
            const pulseTargets = [
                document.getElementById('today-revenue'),
                document.getElementById('sales-count'),
                document.getElementById('kpi-top-performers'),
                document.getElementById('hull-temp'),
                document.getElementById('hull-cond'),
                document.getElementById('product-list'),
                document.getElementById('extended-product-table-body'),
                document.getElementById('till-intelligence-body')
            ].filter(Boolean);
            
            pulseTargets.forEach(el => el.classList.add('loading-pulse'));
            
            try {
                const response = await fetch(`${SHEET_CSV_URL}&t=${Date.now()}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const csvText = await response.text();
                parseCSV(csvText);
                
                // Hide offline alert
                if (offlineAlert) offlineAlert.classList.add('hidden');
                
                // Update status pill
                if (syncStatus) {
                    syncStatus.className = 'sync-status-pill success';
                    syncStatus.innerHTML = `ðŸŸ¢ Live Data Loaded (${salesData.length.toLocaleString()} rows)`;
                }
                
                // Update debug rows
                if (debugRows) debugRows.textContent = salesData.length;
                
                // Refresh weather too
                await fetchLiveHullWeather();
                
                // Render
                processAndRender();
            } catch (error) {
                console.error("Sync failed:", error);
                
                // Show offline alert
                if (offlineAlert) offlineAlert.classList.remove('hidden');
                
                // Update status pill
                if (syncStatus) {
                    syncStatus.className = 'sync-status-pill error';
                    syncStatus.innerHTML = `ðŸ”´ Sync Failed (CORS)`;
                }
                
                alert("âš ï¸ Sync failed. This is typically due to local browser CORS security blocking access to the Google Sheet URL. Click 'Load Sample Data' in the alert box below to load mock transactions.");
            } finally {
                // Remove UI Loading State
                syncBtn.disabled = false;
                syncIcon.classList.remove('spinning-icon');
                syncText.textContent = "Sync Till Data";
                pulseTargets.forEach(el => el.classList.remove('loading-pulse'));
            }
        }

        // Helper: Scrape dataset to find newest YYYY-MM-DD
        function getLatestTransactionDate() {
            if (salesData.length === 0) return "2026-06-14";
            let maxDateStr = "";
            salesData.forEach(item => {
                if (item.timestamp) {
                    const d = parseDateToYYYYMMDD(item.timestamp);
                    if (d && d.match(/^\d{4}-\d{2}-\d{2}$/) && d > maxDateStr) {
                        maxDateStr = d;
                    }
                }
            });
            return maxDateStr || "2026-06-14";
        }

        // Fallback: Populate local sample dataset when Google Sheet fetch is blocked by CORS
        function loadSampleDataFallback() {
            salesData = [];
            const products = [
                { name: "Reggae Rum Punch", cat: "Cocktails", price: 9.75 },
                { name: "Flamin Zombie", cat: "Cocktails", price: 10.00 },
                { name: "Pina Colada", cat: "Cocktails", price: 9.75 },
                { name: "Bob Marley", cat: "Cocktails", price: 9.75 },
                { name: "Red Stripe Pint", cat: "Draught", price: 6.50 },
                { name: "Cruz Campo Pint", cat: "Draught", price: 5.50 },
                { name: "Corona Bottle", cat: "Bottles", price: 5.00 },
                { name: "Roots Diet Coke", cat: "Soft Drinks", price: 3.50 },
                { name: "Water", cat: "Soft Drinks", price: 0.00 },
                { name: "Trinidadian Jerk Chicken", cat: "Classic Roots", price: 16.00 },
                { name: "Mo Bay Chicken Curry", cat: "Dutch Pot", price: 17.00 },
                { name: "Roots Mix It Up", cat: "Jerk Pit", price: 20.50 },
                { name: "Mac & Cheese Balls", cat: "Lite Bites", price: 8.00 },
                { name: "Belly Pork Bites", cat: "Lite Bites", price: 8.00 },
                { name: "House Fries", cat: "Fixins", price: 4.25 }
            ];
            
            // Generate transactions for June 1 to June 14, 2026
            const start = new Date(2026, 5, 1);
            const end = new Date(2026, 5, 14);
            
            let current = new Date(start);
            while (current <= end) {
                const dateStr = formatDateYYYYMMDD(current);
                // Generate 10-20 transactions per day
                const txCount = Math.floor(Math.random() * 11) + 15;
                for (let i = 0; i < txCount; i++) {
                    const p = products[Math.floor(Math.random() * products.length)];
                    const hour = Math.floor(Math.random() * 10) + 12; // 12:00 to 22:00
                    const min = String(Math.floor(Math.random() * 60)).padStart(2, '0');
                    const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
                    const isVoid = Math.random() < 0.04; // 4% voids
                    
                    salesData.push({
                        timestamp: `${dateStr} ${hour}:${min}:${sec}`,
                        productName: p.name,
                        category: p.cat,
                        price: p.price,
                        type: isVoid ? "Void" : "Sale"
                    });
                }
                current.setDate(current.getDate() + 1);
            }
            
            // Hide the offline alert
            const offlineAlert = document.getElementById('offline-alert');
            if (offlineAlert) offlineAlert.classList.add('hidden');
            
            // Update status pill
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) {
                syncStatus.className = 'sync-status-pill success';
                syncStatus.innerHTML = `ðŸŸ¢ Loaded Offline Sample (${salesData.length.toLocaleString()} rows)`;
            }

            // Update debug rows
            const debugRows = document.getElementById('debug-rows');
            if (debugRows) debugRows.textContent = salesData.length;
            
            // Set date inputs to cover the range
            document.getElementById('date-start').value = "2026-06-01";
            document.getElementById('date-end').value = "2026-06-14";
            
            processAndRender();
        }

        // System Today String in YYYY-MM-DD
        function getSystemTodayStr() {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        // ==========================================
        // 4. DATE RANGE PRESETS & MATHEMATICS
        // ==========================================
        function applyPreset(presetId) {
            const latestDateStr = getLatestTransactionDate();
            const latestParts = latestDateStr.split('-');
            const latest = new Date(latestParts[0], latestParts[1] - 1, latestParts[2]);
            
            let startStr = "";
            let endStr = latestDateStr;
            
            if (presetId === 'today') {
                startStr = latestDateStr;
            } else if (presetId === 'yesterday') {
                const yesterday = new Date(latest.getTime() - 24 * 60 * 60 * 1000);
                startStr = formatDateYYYYMMDD(yesterday);
                endStr = startStr;
            } else if (presetId === '7d') {
                const start = new Date(latest.getTime() - 6 * 24 * 60 * 60 * 1000);
                startStr = formatDateYYYYMMDD(start);
            } else if (presetId === 'month') {
                const year = latest.getFullYear();
                const month = latest.getMonth();
                const start = new Date(year, month, 1);
                startStr = formatDateYYYYMMDD(start);
            } else if (presetId === 'all') {
                if (salesData.length > 0) {
                    let minDateStr = latestDateStr;
                    salesData.forEach(item => {
                        if (item.timestamp) {
                            const d = item.timestamp.split(' ')[0];
                            if (d && d.match(/^\d{4}-\d{2}-\d{2}$/) && d < minDateStr) {
                                minDateStr = d;
                            }
                        }
                    });
                    startStr = minDateStr;
                } else {
                    startStr = "2025-12-05";
                }
            }
            
            document.getElementById('date-start').value = startStr;
            document.getElementById('date-end').value = endStr;
            
            // Highlight Active Preset
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.getElementById(`preset-${presetId}`);
            if (activeBtn) activeBtn.classList.add('active');
            
            processAndRender();
        }

        function onCustomDateChange() {
            // Remove active preset highlight because user manually adjusted dates
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            processAndRender();
        }

        function getPreviousPeriod(startStr, endStr) {
            const sParts = startStr.split('-');
            const eParts = endStr.split('-');
            const start = new Date(sParts[0], sParts[1] - 1, sParts[2]);
            const end = new Date(eParts[0], eParts[1] - 1, eParts[2]);
            
            const durationMs = end.getTime() - start.getTime();
            
            // Previous end is one day before current start
            const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
            // Previous start is prevEnd minus duration
            const prevStart = new Date(prevEnd.getTime() - durationMs);
            
            return {
                start: formatDateYYYYMMDD(prevStart),
                end: formatDateYYYYMMDD(prevEnd)
            };
        }

        function formatDateYYYYMMDD(date) {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        // ==========================================
        // 5. PARSING & PROCESSING ENGINE
        // ==========================================
        function parseDateToYYYYMMDD(dateStr) {
            if (!dateStr) return "";
            dateStr = dateStr.trim();
            // Case 1: YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                return dateStr.substring(0, 10);
            }
            // Case 2: DD/MM/YYYY
            if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
                const parts = dateStr.split('/');
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            // Case 3: DD-MM-YYYY
            if (/^\d{2}-\d{2}-\d{4}/.test(dateStr)) {
                const parts = dateStr.split('-');
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            // Fallback: standard Date parsing
            try {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}`;
                }
            } catch(e) {}
            return dateStr;
        }

        function parseCSV(text) {
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length <= 1) return;
            
            salesData = [];
            
            lines.slice(1).forEach(line => {
                const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
                const ts = cols[0]?.replace(/"/g, '');
                if (ts && ts.match(/^\d{4}-\d{2}-\d{2}/)) {
                    salesData.push({
                        timestamp: ts,
                        productName: cols[1]?.replace(/"/g, ''),
                        category: cols[2]?.replace(/"/g, ''),
                        price: parseFloat(cols[3]?.replace(/"/g, '')) || 0,
                        type: cols[4]?.replace(/"/g, '')?.trim()
                    });
                }
            });
        }

        function processAndRender() {
            let startDate = document.getElementById('date-start').value;
            let endDate = document.getElementById('date-end').value;
            
            // Normalize dates
            startDate = parseDateToYYYYMMDD(startDate);
            endDate = parseDateToYYYYMMDD(endDate);
            
            const compareEnabled = document.getElementById('compare-toggle').checked;
            
            // Filter salesData down to selected date range (inclusive)
            const filteredSales = salesData.filter(item => {
                if (!item.timestamp) return false;
                const datePart = parseDateToYYYYMMDD(item.timestamp);
                return datePart >= startDate && datePart <= endDate;
            });
            
            // Fetch previous period if comparison is enabled
            let prevSales = [];
            let prevPeriod = null;
            if (compareEnabled) {
                prevPeriod = getPreviousPeriod(startDate, endDate);
                prevSales = salesData.filter(item => {
                    if (!item.timestamp) return false;
                    const datePart = parseDateToYYYYMMDD(item.timestamp);
                    return datePart >= prevPeriod.start && datePart <= prevPeriod.end;
                });
            }
            
            // Handle Empty states
            if (filteredSales.length === 0) {
                showEmptyStates(startDate, endDate);
                return;
            }
            
            hideEmptyStates();
            
            let totalRevenue = 0;
            let totalSalesCount = 0;
            let categoryCounts = {};
            let hourlyRevenue = Array(24).fill(0);
            productMetrics = {};

            filteredSales.forEach(item => {
                if (item.type && item.type.toLowerCase() === 'void') return;

                totalRevenue += item.price;
                totalSalesCount++;

                if (item.category) {
                    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
                }

                if (item.timestamp && item.timestamp.includes(' ')) {
                    const timePart = item.timestamp.split(' ')[1];
                    const hour = parseInt(timePart.split(':')[0]) || 0;
                    if (hour >= 0 && hour < 24) {
                        hourlyRevenue[hour] += item.price;
                    }
                }

                if (item.productName) {
                    if (!productMetrics[item.productName]) {
                        productMetrics[item.productName] = { 
                            name: item.productName, 
                            qty: 0, 
                            revenue: 0, 
                            category: item.category || "Other" 
                        };
                    }
                    productMetrics[item.productName].qty++;
                    productMetrics[item.productName].revenue += item.price;
                }
            });

            // Compute previous period stats for comparisons
            let prevRevenue = 0;
            let prevSalesCount = 0;
            let prevHourlyRevenue = Array(24).fill(0);
            
            if (compareEnabled) {
                prevSales.forEach(item => {
                    if (item.type && item.type.toLowerCase() === 'void') return;
                    
                    prevRevenue += item.price;
                    prevSalesCount++;
                    
                    if (item.timestamp && item.timestamp.includes(' ')) {
                        const timePart = item.timestamp.split(' ')[1];
                        const hour = parseInt(timePart.split(':')[0]) || 0;
                        if (hour >= 0 && hour < 24) {
                            prevHourlyRevenue[hour] += item.price;
                        }
                    }
                });
            }

            // Update KPI Card values
            document.getElementById('today-revenue').textContent = `Â£${totalRevenue.toFixed(2)}`;
            document.getElementById('sales-count').textContent = `${totalSalesCount} sales logged`;

            // Calculate Best Drink and Best Food performer rows
            let bestDrink = { name: "-", qty: 0, category: "" };
            let bestFood = { name: "-", qty: 0, category: "" };

            const DRINK_CATEGORIES = ["Cocktails", "Bottles", "Draught", "Draught Beer", "Soft Drinks", "Spirits", "Rum", "Wine", "Beers", "Drinks"];

            Object.values(productMetrics).forEach(item => {
                const cat = item.category || "";
                const isDrink = DRINK_CATEGORIES.some(dc => cat.toLowerCase().includes(dc.toLowerCase()));
                if (isDrink) {
                    if (item.qty > bestDrink.qty) {
                        bestDrink = { name: item.name, qty: item.qty, category: item.category };
                    }
                } else {
                    if (item.qty > bestFood.qty) {
                        bestFood = { name: item.name, qty: item.qty, category: item.category };
                    }
                }
            });

            // Update UI elements for Best Drink and Best Food
            const drinkRowEl = document.getElementById('best-drink-row');
            const drinkNameEl = document.getElementById('best-drink-name');
            const drinkQtyEl = document.getElementById('best-drink-qty');

            const foodRowEl = document.getElementById('best-food-row');
            const foodNameEl = document.getElementById('best-food-name');
            const foodQtyEl = document.getElementById('best-food-qty');

            if (bestDrink.qty > 0) {
                const drinkEmoji = getProductEmoji(bestDrink.name, bestDrink.category);
                if (drinkNameEl) drinkNameEl.innerHTML = `${drinkEmoji} ${bestDrink.name}`;
                if (drinkQtyEl) drinkQtyEl.textContent = `${bestDrink.qty} sold`;
                if (drinkRowEl) drinkRowEl.setAttribute('data-product', bestDrink.name);
            } else {
                if (drinkNameEl) drinkNameEl.textContent = "-";
                if (drinkQtyEl) drinkQtyEl.textContent = "-";
                if (drinkRowEl) drinkRowEl.removeAttribute('data-product');
            }

            if (bestFood.qty > 0) {
                const foodEmoji = getProductEmoji(bestFood.name, bestFood.category);
                if (foodNameEl) foodNameEl.innerHTML = `${foodEmoji} ${bestFood.name}`;
                if (foodQtyEl) foodQtyEl.textContent = `${bestFood.qty} sold`;
                if (foodRowEl) foodRowEl.setAttribute('data-product', bestFood.name);
            } else {
                if (foodNameEl) foodNameEl.textContent = "-";
                if (foodQtyEl) foodQtyEl.textContent = "-";
                if (foodRowEl) foodRowEl.removeAttribute('data-product');
            }

            // Update Comparison badges
            if (compareEnabled) {
                const revPctChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
                const salesPctChange = prevSalesCount > 0 ? ((totalSalesCount - prevSalesCount) / prevSalesCount) * 100 : 0;
                
                updateCompareBadge('compare-revenue-badge', revPctChange);
                updateCompareBadge('compare-sales-badge', salesPctChange);
            } else {
                updateCompareBadge('compare-revenue-badge', null);
                updateCompareBadge('compare-sales-badge', null);
            }

            // Refresh Sub-modules
            renderPeakTimesChart(filteredSales, prevSales, compareEnabled);
            renderProductRanking();
            renderExtendedProductTab();
            renderWeatherTrendsTab(totalRevenue, categoryCounts);
            
            // Inject dynamic Till Intelligence Comparative Insights
            document.getElementById('till-intelligence-body').innerHTML = generateBusinessInsights(filteredSales, prevSales, compareEnabled);
            
            // Competitor Watch Sub-module updates
            renderCompetitorComparison();
            renderCategoryIndexGauges();
            generatePricingRecommendations(filteredSales);
            renderCompetitorOffers();
            
            // New Integration Dashboards
            activeFilteredSales = filteredSales;
            renderReviewsTab();
            
            // New Weekly Trends & Seller Deep-Dives
            renderWeeklyTrends();
            renderSellerDeepDiveInsights();
        }

        function updateCompareBadge(badgeId, pctChange) {
            const badge = document.getElementById(badgeId);
            if (!badge) return;
            
            if (pctChange === null || pctChange === undefined) {
                badge.classList.add('hidden');
                return;
            }
            
            badge.classList.remove('hidden');
            const direction = pctChange >= 0 ? "+" : "";
            const pctText = `${direction}${pctChange.toFixed(1)}%`;
            
            badge.className = 'comp-badge'; // Reset classes
            if (pctChange > 0) {
                badge.classList.add('up');
                badge.innerHTML = `â–² ${pctText}`;
            } else if (pctChange < 0) {
                badge.classList.add('down');
                badge.innerHTML = `â–¼ ${pctText}`;
            } else {
                badge.classList.add('flat');
                badge.innerHTML = `â–  ${pctText}`;
            }
        }

        // Graceful UI Empty States
        function showEmptyStates(startDate, endDate) {
            document.getElementById('today-revenue').textContent = "Â£0.00";
            document.getElementById('sales-count').textContent = "0 transactions logged";
            
            const drinkRowEl = document.getElementById('best-drink-row');
            const drinkNameEl = document.getElementById('best-drink-name');
            const drinkQtyEl = document.getElementById('best-drink-qty');
            const foodRowEl = document.getElementById('best-food-row');
            const foodNameEl = document.getElementById('best-food-name');
            const foodQtyEl = document.getElementById('best-food-qty');
            if (drinkNameEl) drinkNameEl.textContent = "-";
            if (drinkQtyEl) drinkQtyEl.textContent = "-";
            if (drinkRowEl) drinkRowEl.removeAttribute('data-product');
            if (foodNameEl) foodNameEl.textContent = "-";
            if (foodQtyEl) foodQtyEl.textContent = "-";
            if (foodRowEl) foodRowEl.removeAttribute('data-product');
            
            updateCompareBadge('compare-revenue-badge', null);
            updateCompareBadge('compare-sales-badge', null);
            
            // Clear charts and show empty overlay
            if (peakChart) peakChart.destroy();
            document.getElementById('chart-empty-overlay').classList.remove('hidden');
            document.getElementById('product-empty-overlay').classList.remove('hidden');
            
            document.getElementById('product-list').innerHTML = `
                <li style="justify-content: center; color: var(--text-muted);">
                    No transactions recorded.
                </li>
            `;
            
            document.getElementById('extended-product-table-body').innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                        ðŸ“­ No menu items sold in this date range.
                    </td>
                </tr>
            `;
            
            document.getElementById('weather-advice-card').innerHTML = `
                <div class="weather-advice-header">
                    <span class="advice-icon">ðŸŒ¤ï¸</span>
                    <h3>No Data Available</h3>
                </div>
                <p>No operational recommendations are available because there is no till data for this range.</p>
            `;
            
            document.getElementById('weather-sales-split').innerHTML = `
                <h3>Sales Slicing (Food vs. Drinks)</h3>
                <p style="color: var(--text-muted); margin-top: 15px; text-align: center;">No metrics available.</p>
            `;
            
            document.getElementById('till-intelligence-body').innerHTML = `
                <p style="color: var(--text-muted);">No sales data available to compile business intelligence reports.</p>
            `;
        }

        function hideEmptyStates() {
            document.getElementById('chart-empty-overlay').classList.add('hidden');
            document.getElementById('product-empty-overlay').classList.add('hidden');
        }

        // ==========================================
        // 6. TILL INTELLIGENCE COMPARATIVE INSIGHTS
        // ==========================================
        function generateBusinessInsights(currentSales, previousSales, compareEnabled) {
            if (!compareEnabled) {
                return `<p style="color: var(--text-muted);">ðŸ’¡ Enable <strong>"Compare to Previous Period"</strong> above to generate live comparative insights, growth drivers, void reports, and operational intelligence guidelines.</p>`;
            }
            
            if (!previousSales || previousSales.length === 0 || currentSales.length === 0) {
                return `<p style="color: var(--text-muted);">âš ï¸ Incomplete transactional records for either the selected range or the preceding comparison period to calculate data insight vectors.</p>`;
            }
            
            // Calculate current stats
            let curRev = 0;
            let curCount = 0;
            let curVoids = 0;
            let curVoidCount = 0;
            let curCatCounts = {};
            let curDaypartRev = { "Lunch": 0, "Dinner": 0, "Late Night": 0 };
            let curWeatherRev = {};
            let curDayOfWeekRev = Array(7).fill(0);
            
            currentSales.forEach(item => {
                if (item.type && item.type.toLowerCase() === 'void') {
                    curVoids += item.price;
                    curVoidCount++;
                    return;
                }
                curRev += item.price;
                curCount++;
                if (item.category) {
                    curCatCounts[item.category] = (curCatCounts[item.category] || 0) + item.price;
                }
                
                // Daypart Rev
                const dp = getDaypart(item.timestamp);
                curDaypartRev[dp] = (curDaypartRev[dp] || 0) + item.price;
                
                // Weather Rev
                if (item.timestamp) {
                    const datePart = item.timestamp.split(' ')[0];
                    const w = getWeatherForDate(datePart);
                    curWeatherRev[w] = (curWeatherRev[w] || 0) + item.price;
                    
                    const dateObj = new Date(datePart);
                    const day = dateObj.getDay();
                    curDayOfWeekRev[day] += item.price;
                }
            });
            
            // Calculate previous stats
            let prevRev = 0;
            let prevCount = 0;
            let prevCatCounts = {};
            let prevDaypartRev = { "Lunch": 0, "Dinner": 0, "Late Night": 0 };
            
            previousSales.forEach(item => {
                if (item.type && item.type.toLowerCase() === 'void') return;
                prevRev += item.price;
                prevCount++;
                if (item.category) {
                    prevCatCounts[item.category] = (prevCatCounts[item.category] || 0) + item.price;
                }
                
                const dp = getDaypart(item.timestamp);
                prevDaypartRev[dp] = (prevDaypartRev[dp] || 0) + item.price;
            });
            
            if (prevRev === 0) {
                return `<p style="color: var(--text-muted);">Incomplete comparison metrics. Historical period has zero revenue recorded.</p>`;
            }
            
            const revDiff = curRev - prevRev;
            const revPct = ((revDiff / prevRev) * 100).toFixed(1);
            const countDiff = curCount - prevCount;
            const countPct = prevCount > 0 ? ((countDiff / prevCount) * 100).toFixed(1) : 0;
            
            let insights = [];
            
            // 1. Momentum Insight
            const growthDir = revDiff >= 0 ? "growth" : "decline";
            const growthColorClass = revDiff >= 0 ? "text-palm-green" : "text-error-red";
            const growthSymbol = revDiff >= 0 ? "ðŸ“ˆ" : "ðŸ“‰";
            
            const curAOV = curCount > 0 ? curRev / curCount : 0;
            const prevAOV = prevCount > 0 ? prevRev / prevCount : 0;
            const aovPctChange = prevAOV > 0 ? (((curAOV - prevAOV) / prevAOV) * 100).toFixed(1) : 0;
            
            insights.push(`
                <li>
                    <strong>${growthSymbol} Revenue Momentum:</strong> 
                    Net sales show a <span class="${growthColorClass}"><strong>${Math.abs(revPct)}% ${growthDir}</strong></span> shift (absolute shift of <strong>Â£${Math.abs(revDiff).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</strong>) WoW. Transaction volume changed by <strong>${Math.abs(countPct)}%</strong> while Average Ticket Size (AOV) shifted by <strong>${aovPctChange}%</strong> to <strong>Â£${curAOV.toFixed(2)}</strong>.
                </li>
            `);
            
            // 2. Category Drivers
            let catDiffs = [];
            const allCats = new Set([...Object.keys(curCatCounts), ...Object.keys(prevCatCounts)]);
            allCats.forEach(cat => {
                const cur = curCatCounts[cat] || 0;
                const prev = prevCatCounts[cat] || 0;
                catDiffs.push({ category: cat, diff: cur - prev, cur, prev });
            });
            
            catDiffs.sort((a, b) => b.diff - a.diff);
            const topGrowth = catDiffs[0];
            const topDecline = catDiffs[catDiffs.length - 1];
            
            function getCategoryEmoji(catName) {
                const c = catName.toLowerCase();
                if (c.includes("cocktail") || c.includes("rum")) return "ðŸ¹";
                if (c.includes("beer") || c.includes("draught") || c.includes("bottle")) return "ðŸº";
                if (c.includes("classic") || c.includes("mains") || c.includes("pit") || c.includes("pot")) return "ðŸ—";
                if (c.includes("bite") || c.includes("appetizer") || c.includes("fixin") || c.includes("fry")) return "ðŸŸ";
                return "ðŸ“Š";
            }
            
            if (topGrowth && topGrowth.diff > 0) {
                const growthRatio = topGrowth.prev > 0 ? ((topGrowth.diff / topGrowth.prev) * 100).toFixed(0) : 100;
                const emoji = getCategoryEmoji(topGrowth.category);
                insights.push(`
                    <li>
                        <strong>${emoji} Primary Driver:</strong> 
                        The fastest growing category is <span class="text-palm-green"><strong>${topGrowth.category}</strong></span>, which grew by <strong>Â£${topGrowth.diff.toFixed(2)}</strong> (+<strong>${growthRatio}%</strong>). Ensure inventory levels match this rising demand.
                    </li>
                `);
            }
            
            if (topDecline && topDecline.diff < 0) {
                const emoji = getCategoryEmoji(topDecline.category);
                insights.push(`
                    <li>
                        <strong>âš ï¸ Category Drag:</strong> 
                        Sales in <span class="text-error-red"><strong>${topDecline.category}</strong></span> decreased by <strong>Â£${Math.abs(topDecline.diff).toFixed(2)}</strong>. Evaluate menu positioning or run a target promo to reverse this trend.
                    </li>
                `);
            }
            
            // 3. Voids analysis (Celebratory state when voids = 0)
            const voidPct = curRev > 0 ? ((curVoids / (curRev + curVoids)) * 100).toFixed(1) : 0;
            if (voidPct > 3) {
                insights.push(`
                    <li>
                        <strong>ðŸš¨ Void Leakage Alert:</strong> 
                        Voids represent <span class="text-error-red"><strong>${voidPct}%</strong></span> of gross sales (<strong>Â£${curVoids.toFixed(2)}</strong> across <strong>${curVoidCount}</strong> voided entries). This exceeds the 3% target, signaling staff order-entry error or kitchen delays.
                    </li>
                `);
            } else if (voidPct > 0) {
                insights.push(`
                    <li>
                        <strong>ðŸ”’ Voids & Wastage:</strong> 
                        Voids are stable at <strong>${voidPct}%</strong> of sales (<strong>Â£${curVoids.toFixed(2)}</strong>), keeping within your standard <3% target threshold.
                    </li>
                `);
            } else {
                insights.push(`
                    <li>
                        <strong>ðŸŽ‰ Perfect Order Accuracy:</strong> 
                        Outstanding execution! <strong>0% voids or wastage</strong> recorded in this period. Staff order accuracy and kitchen compliance are operating at a perfect 100%.
                    </li>
                `);
            }
            
            // 4. Daypart growth analysis
            let dpDiffs = [];
            Object.keys(curDaypartRev).forEach(dp => {
                const cur = curDaypartRev[dp] || 0;
                const prev = prevDaypartRev[dp] || 0;
                dpDiffs.push({ daypart: dp, diff: cur - prev, cur, prev });
            });
            dpDiffs.sort((a, b) => b.diff - a.diff);
            const bestDp = dpDiffs[0];
            if (bestDp && bestDp.diff > 10) {
                const pct = bestDp.prev > 0 ? ((bestDp.diff / bestDp.prev) * 100).toFixed(0) : 100;
                insights.push(`
                    <li>
                        <strong>ðŸ•’ Shift Performance:</strong> 
                        The <span class="text-palm-green"><strong>${bestDp.daypart}</strong></span> shift experienced the strongest surge, rising by <strong>Â£${bestDp.diff.toFixed(2)}</strong> (+<strong>${pct}%</strong>) WoW. Align floor staffing levels to match this busy window.
                    </li>
                `);
            }
            
            // 5. Dynamic Weather Analysis
            const weatherSales = {};
            const weatherDays = {};
            currentSales.forEach(item => {
                if (item.type && item.type.toLowerCase() === 'void') return;
                if (!item.timestamp) return;
                const datePart = item.timestamp.split(' ')[0];
                const w = getWeatherForDate(datePart);
                weatherSales[w] = (weatherSales[w] || 0) + item.price;
                if (!weatherDays[w]) weatherDays[w] = new Set();
                weatherDays[w].add(datePart);
            });
            
            let weatherInsights = [];
            Object.keys(weatherSales).forEach(w => {
                const daysCount = weatherDays[w].size;
                if (daysCount > 0) {
                    const avg = weatherSales[w] / daysCount;
                    weatherInsights.push({ weather: w, avg, total: weatherSales[w], days: daysCount });
                }
            });
            
            if (weatherInsights.length > 1) {
                weatherInsights.sort((a, b) => b.avg - a.avg);
                const bestWeather = weatherInsights[0];
                const worstWeather = weatherInsights[weatherInsights.length - 1];
                const diffPct = (((bestWeather.avg - worstWeather.avg) / worstWeather.avg) * 100).toFixed(0);
                
                const weatherEmojis = { "Warm": "â˜€ï¸", "Moderate": "â›…", "Rainy": "ðŸŒ§ï¸", "Cold": "â„ï¸" };
                const bestEmoji = weatherEmojis[bestWeather.weather] || "ðŸŒ¤ï¸";
                const worstEmoji = weatherEmojis[worstWeather.weather] || "ðŸŒ¤ï¸";
                
                insights.push(`
                    <li>
                        <strong>${bestEmoji} Weather Correlation:</strong> 
                        Daily revenue peaked during <strong>${bestWeather.weather}</strong> conditions, averaging <strong>Â£${bestWeather.avg.toFixed(2)}/day</strong>. This is <strong>${diffPct}% higher</strong> than under <strong>${worstWeather.weather}</strong> conditions (${worstEmoji} <strong>Â£${worstWeather.avg.toFixed(2)}/day</strong> average). 
                        ${worstWeather.weather === "Rainy" ? "<em>Tip:</em> Push delivery promotions when rain is forecasted to offset lower dining room traffic." : ""}
                    </li>
                `);
            }
            
            // 6. Weakest Day of Week
            let dayAverages = [];
            const daysNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            
            const uniqueDatesPerDay = Array(7).fill(0).map(() => new Set());
            currentSales.forEach(item => {
                if (item.type && item.type.toLowerCase() === 'void') return;
                if (!item.timestamp) return;
                const datePart = item.timestamp.split(' ')[0];
                const dObj = new Date(datePart);
                const dayIdx = dObj.getDay();
                uniqueDatesPerDay[dayIdx].add(datePart);
            });
            
            for (let i = 0; i < 7; i++) {
                const numDays = uniqueDatesPerDay[i].size;
                if (numDays > 0) {
                    const totalForDay = curDayOfWeekRev[i];
                    dayAverages.push({ dayIndex: i, name: daysNames[i], avg: totalForDay / numDays, total: totalForDay });
                }
            }
            
            if (dayAverages.length > 2) {
                dayAverages.sort((a, b) => a.avg - b.avg);
                const weakest = dayAverages[0];
                if (weakest.avg < 300) {
                    insights.push(`
                        <li>
                            <strong>ðŸ“… Weekly Traffic Dip:</strong> 
                            <strong>${weakest.name}</strong> is currently your slowest day, averaging <strong>Â£${weakest.avg.toFixed(2)}/day</strong>. Consider introducing a targeted mid-week promo to boost traffic.
                        </li>
                    `);
                }
            }
            
            return `
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 15px; font-size: 14px; line-height: 1.5;">
                    ${insights.join('')}
                </ul>
            `;
        }

// ==========================================
// 7. RENDER MODULES (CHARTS, TABLES & VIEWS)
// ==========================================
function renderPeakTimesChart(currentSales, previousSales, compareEnabled) {
    const ctx = document.getElementById('peakTimesChart').getContext('2d');
    if (peakChart) peakChart.destroy();

    let labels = [];
    let currentData = [];
    let previousData = [];
    let chartLabelCurrent = 'Selected Period (Â£)';
    let chartLabelPrevious = 'Previous Period (Â£)';

    if (activeChartView === 'hourly') {
        const curHourly = Array(24).fill(0);
        const prevHourly = Array(24).fill(0);

        currentSales.forEach(item => {
            if (item.type && item.type.toLowerCase() === 'void') return;
            if (item.timestamp && item.timestamp.includes(' ')) {
                const hour = parseInt(item.timestamp.split(' ')[1].split(':')[0]) || 0;
                curHourly[hour] += item.price;
            }
        });

        if (compareEnabled && previousSales) {
            previousSales.forEach(item => {
                if (item.type && item.type.toLowerCase() === 'void') return;
                if (item.timestamp && item.timestamp.includes(' ')) {
                    const hour = parseInt(item.timestamp.split(' ')[1].split(':')[0]) || 0;
                    prevHourly[hour] += item.price;
                }
            });
        }

        for (let h = 0; h < 24; h++) {
            if (curHourly[h] > 0 || (compareEnabled && prevHourly[h] > 0)) {
                labels.push(`${h.toString().padStart(2, '0')}:00`);
                currentData.push(curHourly[h]);
                if (compareEnabled) {
                    previousData.push(prevHourly[h]);
                }
            }
        }
    } else if (activeChartView === 'daily') {
        const curDaily = {};
        currentSales.forEach(item => {
            if (item.type && item.type.toLowerCase() === 'void') return;
            if (item.timestamp) {
                const d = parseDateToYYYYMMDD(item.timestamp);
                curDaily[d] = (curDaily[d] || 0) + item.price;
            }
        });

        const currentDates = Object.keys(curDaily).sort();
        labels = currentDates.map(d => {
            const parts = d.split('-');
            if (parts.length === 3) {
                const dateObj = new Date(parts[0], parts[1]-1, parts[2]);
                return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            }
            return d;
        });
        currentData = currentDates.map(d => curDaily[d]);

        if (compareEnabled && previousSales) {
            const prevDaily = {};
            previousSales.forEach(item => {
                if (item.type && item.type.toLowerCase() === 'void') return;
                if (item.timestamp) {
                    const d = parseDateToYYYYMMDD(item.timestamp);
                    prevDaily[d] = (prevDaily[d] || 0) + item.price;
                }
            });
            const prevDates = Object.keys(prevDaily).sort();
            
            for (let i = 0; i < currentDates.length; i++) {
                if (i < prevDates.length) {
                    previousData.push(prevDaily[prevDates[i]]);
                } else {
                    previousData.push(0);
                }
            }
        }
        chartLabelCurrent = 'Daily Revenue (Â£)';
        chartLabelPrevious = 'Prev Period Daily (Â£)';
    } else if (activeChartView === 'dayofweek') {
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

        const curDayMap = {};
        currentSales.forEach(item => {
            if (item.type && item.type.toLowerCase() === 'void') return;
            if (item.timestamp) {
                const dateStr = parseDateToYYYYMMDD(item.timestamp);
                curDayMap[dateStr] = (curDayMap[dateStr] || 0) + item.price;
            }
        });

        const curDayOfWeekSum = {};
        const curDayOfWeekCount = {};
        Object.entries(curDayMap).forEach(([dateStr, rev]) => {
            const dayIndex = new Date(dateStr).getDay();
            const dayName = daysOfWeek[dayIndex];
            curDayOfWeekSum[dayName] = (curDayOfWeekSum[dayName] || 0) + rev;
            curDayOfWeekCount[dayName] = (curDayOfWeekCount[dayName] || 0) + 1;
        });

        currentData = labels.map(dayName => {
            const sum = curDayOfWeekSum[dayName] || 0;
            const count = curDayOfWeekCount[dayName] || 1;
            return sum / count;
        });

        if (compareEnabled && previousSales) {
            const prevDayMap = {};
            previousSales.forEach(item => {
                if (item.type && item.type.toLowerCase() === 'void') return;
                if (item.timestamp) {
                    const dateStr = parseDateToYYYYMMDD(item.timestamp);
                    prevDayMap[dateStr] = (prevDayMap[dateStr] || 0) + item.price;
                }
            });

            const prevDayOfWeekSum = {};
            const prevDayOfWeekCount = {};
            Object.entries(prevDayMap).forEach(([dateStr, rev]) => {
                const dayIndex = new Date(dateStr).getDay();
                const dayName = daysOfWeek[dayIndex];
                prevDayOfWeekSum[dayName] = (prevDayOfWeekSum[dayName] || 0) + rev;
                prevDayOfWeekCount[dayName] = (prevDayOfWeekCount[dayName] || 0) + 1;
            });

            previousData = labels.map(dayName => {
                const sum = prevDayOfWeekSum[dayName] || 0;
                const count = prevDayOfWeekCount[dayName] || 1;
                return sum / count;
            });
        }
        chartLabelCurrent = 'Selected Period Avg (Â£)';
        chartLabelPrevious = 'Previous Period Avg (Â£)';
    }

    const currentGradient = ctx.createLinearGradient(0, 0, 0, 300);
    currentGradient.addColorStop(0, 'rgba(255, 94, 54, 0.95)');
    currentGradient.addColorStop(1, 'rgba(255, 26, 64, 0.3)');

    const previousGradient = ctx.createLinearGradient(0, 0, 0, 300);
    previousGradient.addColorStop(0, 'rgba(0, 212, 255, 0.9)');
    previousGradient.addColorStop(1, 'rgba(0, 80, 192, 0.15)');

    const datasets = [{
        label: chartLabelCurrent,
        data: currentData,
        backgroundColor: currentGradient,
        borderColor: 'rgba(255, 94, 54, 0.8)',
        borderWidth: 1,
        borderRadius: 8,
        order: 1
    }];

    if (compareEnabled && previousData.length > 0) {
        datasets.push({
            label: chartLabelPrevious,
            data: previousData,
            backgroundColor: previousGradient,
            borderColor: 'rgba(0, 212, 255, 0.6)',
            borderWidth: 1,
            borderRadius: 8,
            order: 2
        });
    }

    peakChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255, 255, 255, 0.03)' }, 
                    ticks: { 
                        color: '#8892b0',
                        font: { family: 'Space Grotesk', size: 10 }
                    } 
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { 
                        color: '#8892b0',
                        font: { family: 'Space Grotesk', size: 10 }
                    } 
                }
            },
            plugins: { 
                legend: { 
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: '#8892b0',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 12, family: 'Outfit', weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: '#12161c',
                    titleColor: '#fff',
                    titleFont: { family: 'Space Grotesk', weight: 'bold' },
                    bodyColor: '#8892b0',
                    bodyFont: { family: 'Outfit' },
                    borderColor: 'rgba(255, 94, 54, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8
                }
            }
        }
    });
}

function switchProductTab(tabType) {
    currentProductTab = tabType;
    document.getElementById('btn-product-top').classList.remove('active');
    document.getElementById('btn-product-low').classList.remove('active');
    
    if (tabType === 'top') {
        document.getElementById('btn-product-top').classList.add('active');
    } else {
        document.getElementById('btn-product-low').classList.add('active');
    }
    
    renderProductRanking();
}

function renderProductRanking() {
    const listContainer = document.getElementById('product-list');
    const items = Object.values(productMetrics);
    
    if (items.length === 0) {
        listContainer.innerHTML = '<li>No menu items sold in this period.</li>';
        return;
    }
    
    if (currentProductTab === 'top') {
        items.sort((a, b) => b.qty - a.qty);
    } else {
        items.sort((a, b) => a.qty - b.qty);
    }

    listContainer.innerHTML = items.slice(0, 5).map(item => `
        <li>
            <span>${item.name}</span>
            <span class="qty">${item.qty} sold (Â£${item.revenue.toFixed(2)})</span>
        </li>
    `).join('');
}

// Extended Product Performance Tab
function renderExtendedProductTab() {
    const tbody = document.getElementById('extended-product-table-body');
    if (!tbody) return;
    
    const searchVal = document.getElementById('product-search')?.value.toLowerCase() || "";
    const categoryVal = document.getElementById('product-category-filter')?.value || "all";
    const daypartVal = document.getElementById('product-daypart-filter')?.value || "all";
    const weatherVal = document.getElementById('product-weather-filter')?.value || "all";
    const groupingVal = document.getElementById('product-grouping-filter')?.value || "none";
    
    if (activeFilteredSales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px 0;">No active date range sales data.</td></tr>`;
        return;
    }
    
    // Process active filtered sales into product-specific counts based on filters
    const currentProductMetrics = {};
    let activeTotalQty = 0;
    
    activeFilteredSales.forEach(item => {
        if (item.type && item.type.toLowerCase() === 'void') return;
        
        // Filter by Daypart
        if (daypartVal !== 'all') {
            const dp = getDaypart(item.timestamp);
            if (dp !== daypartVal) return;
        }
        
        // Filter by Weather
        if (weatherVal !== 'all') {
            const datePart = parseDateToYYYYMMDD(item.timestamp);
            const w = getWeatherForDate(datePart);
            if (w !== weatherVal) return;
        }
        
        if (item.productName) {
            const cat = item.category || "Other";
            
            // Search filter
            const matchesSearch = item.productName.toLowerCase().includes(searchVal);
            
            // Category filter
            const matchesCategory = categoryVal === 'all' || cat === categoryVal;
            
            if (matchesSearch && matchesCategory) {
                if (!currentProductMetrics[item.productName]) {
                    currentProductMetrics[item.productName] = {
                        name: item.productName,
                        qty: 0,
                        revenue: 0,
                        category: cat
                    };
                }
                currentProductMetrics[item.productName].qty++;
                currentProductMetrics[item.productName].revenue += item.price;
                activeTotalQty++;
            }
        }
    });
    
    // Populate select element filter options dynamically once
    const categorySelect = document.getElementById('product-category-filter');
    if (categorySelect && categorySelect.options.length === 1) {
        const categories = [...new Set(salesData.map(item => item.category))].filter(Boolean);
        categories.sort().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
        });
    }
    
    const items = Object.values(currentProductMetrics);
    
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 0;">No products match the selected filters.</td></tr>`;
        return;
    }
    
    // Sort items
    sortProductList(items, productSortColumn, productSortAsc, activeTotalQty);
    
    // Update header sort indicator UI
    updateSortHeadersUI();
    
    if (groupingVal === 'category') {
        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = {
                    name: item.category,
                    qty: 0,
                    revenue: 0,
                    items: []
                };
            }
            grouped[item.category].qty += item.qty;
            grouped[item.category].revenue += item.revenue;
            grouped[item.category].items.push(item);
        });
        
        const sortedGroups = Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
        
        let html = "";
        sortedGroups.forEach((group, gIdx) => {
            const groupPct = activeTotalQty > 0 ? ((group.qty / activeTotalQty) * 100).toFixed(1) : '0.0';
            const groupId = `cat-group-${gIdx}`;
            
            html += `
                <tr class="category-header-row" onclick="toggleCategoryGroup('${groupId}')" style="cursor: pointer; background: rgba(255, 94, 54, 0.08); font-weight: bold;">
                    <td><span class="toggle-arrow" id="arrow-${groupId}" style="display: inline-block; margin-right: 8px; transition: transform 0.2s;">â–¼</span>${group.name}</td>
                    <td><span class="category-pill" style="background: var(--sunset-orange); color: white;">Subtotal</span></td>
                    <td>${group.qty} sold</td>
                    <td class="revenue-cell">Â£${group.revenue.toFixed(2)}</td>
                    <td>
                        <div class="progress-bar-container">
                            <div style="background-color: var(--palm-green); height: 6px; border-radius: 3px; width: ${Math.min(parseFloat(groupPct) * 2.5, 100)}%;"></div>
                            <span class="progress-text" style="color: var(--palm-green);">${groupPct}%</span>
                        </div>
                    </td>
                </tr>
            `;
            
            group.items.forEach(item => {
                const itemPct = activeTotalQty > 0 ? ((item.qty / activeTotalQty) * 100).toFixed(1) : '0.0';
                const emoji = getProductEmoji(item.name, item.category);
                html += `
                    <tr class="category-item-row ${groupId}" style="background: rgba(255, 255, 255, 0.01); transition: opacity 0.2s;">
                        <td style="padding-left: 30px;">${emoji} ${item.name}</td>
                        <td><span class="category-pill">${item.category}</span></td>
                        <td>${item.qty} sold</td>
                        <td class="revenue-cell">Â£${item.revenue.toFixed(2)}</td>
                        <td>
                            <div class="progress-bar-container">
                                <div style="background-color: var(--sunset-orange); height: 6px; border-radius: 3px; width: ${Math.min(parseFloat(itemPct) * 2.5, 100)}%;"></div>
                                <span class="progress-text">${itemPct}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            });
        });
        
        tbody.innerHTML = html;
    } else {
        tbody.innerHTML = items.map(item => {
            const pct = activeTotalQty > 0 ? ((item.qty / activeTotalQty) * 100).toFixed(1) : '0.0';
            const emoji = getProductEmoji(item.name, item.category);
            return `
                <tr>
                    <td><strong>${emoji} ${item.name}</strong></td>
                    <td><span class="category-pill">${item.category}</span></td>
                    <td>${item.qty} sold</td>
                    <td class="revenue-cell">Â£${item.revenue.toFixed(2)}</td>
                    <td>
                        <div class="progress-bar-container">
                            <div style="background-color: var(--sunset-orange); height: 6px; border-radius: 3px; width: ${Math.min(parseFloat(pct) * 2.5, 100)}%;"></div>
                            <span class="progress-text">${pct}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// Weather Operations Insights Tab
function renderWeatherTrendsTab(totalRevenue, categoryCounts) {
    const tempVal = parseInt(document.getElementById('hull-temp').textContent) || 15;
    const skyVal = document.getElementById('hull-cond').textContent;
    
    const isWarm = tempVal >= 18;
    const isCold = tempVal <= 10;
    const isRainy = skyVal.includes("Rain") || skyVal.includes("Drizzle");
    
    let adviceHTML = "";
    let adviceTitle = "";
    let adviceIcon = "";
    
    if (isWarm) {
        adviceIcon = "â˜€ï¸";
        adviceTitle = "Warm Weather Operations Guide";
        adviceHTML = `
            <p>Temperatures are hitting <strong>${tempVal}Â°C</strong>. Warm, sunny weather on Newland Ave drives significant pedestrian patio dining and heavy drinks trade.</p>
            <ul class="advice-list">
                <li>ðŸ¹ <strong>Cocktails & Draught:</strong> Anticipate a 30-40% volume spike on Cocktails and pints (Red Stripe, Cruz Campo).</li>
                <li>ðŸ§Š <strong>Operations:</strong> Ensure the ice maker is running continuously and pre-cool glasses for beer.</li>
                <li>ðŸŒ¿ <strong>Stock:</strong> Double check fresh mint and lime inventory for mojitos.</li>
            </ul>
        `;
    } else if (isCold) {
        adviceIcon = "â„ï¸";
        adviceTitle = "Cold Weather Operations Guide";
        adviceHTML = `
            <p>Temperatures are down to <strong>${tempVal}Â°C</strong>. Chilly weather shifts consumer preferences toward hearty, warm comfort foods.</p>
            <ul class="advice-list">
                <li>ðŸ› <strong>Hearty Foods:</strong> Expect increased demand for Papa G Curry Goat, Mo Bay Curry Chicken, and hot sides.</li>
                <li>ðŸ”¥ <strong>Operations:</strong> Keep kitchen prep high for stews and curries. Ensure dining area heaters are functional.</li>
                <li>ðŸ¥ƒ <strong>Spirits:</strong> Prominently display warm rum-spiked options or double down on spiced rum mixers.</li>
            </ul>
        `;
    } else {
        adviceIcon = "â›…";
        adviceTitle = "Moderate Weather Operations Guide";
        adviceHTML = `
            <p>Temperatures are around <strong>${tempVal}Â°C</strong> with stable sky conditions. Normal operations expected.</p>
            <ul class="advice-list">
                <li>ðŸ“Š <strong>Balanced Sales:</strong> Expect a standard distribution of food and drinks volume.</li>
                <li>ðŸ— <strong>Jerk Chicken:</strong> Jerk platters and wraps will drive core lunch/dinner revenues.</li>
            </ul>
        `;
    }
    
    if (isRainy) {
        adviceHTML += `
            <div class="rain-warning-box">
                <strong>ðŸŒ§ï¸ Rain Warning:</strong> Precipitation detected. Outdoor seating will be inactive. Delivery volume (UberEats/JustEat) and takeaway orders are projected to rise. Ensure packaging containers are prepped.
            </div>
        `;
    }
    
    // Compute Food vs Drinks split for the range
    const startDate = parseDateToYYYYMMDD(document.getElementById('date-start').value);
    const endDate = parseDateToYYYYMMDD(document.getElementById('date-end').value);
    let drinksRev = 0;
    let foodRev = 0;
    let drinksCount = 0;
    let foodCount = 0;
    
    salesData.forEach(item => {
        if (!item.timestamp) return;
        const datePart = parseDateToYYYYMMDD(item.timestamp);
        if (datePart < startDate || datePart > endDate) return;
        if (item.type && item.type.toLowerCase() === 'void') return;
        
        const cat = item.category || "";
        const isDrink = ["Cocktails", "Bottles", "Draught", "Soft Drinks", "Spirits", "Rum", "Wine"].includes(cat);
        if (isDrink) {
            drinksRev += item.price;
            drinksCount++;
        } else {
            foodRev += item.price;
            foodCount++;
        }
    });
    
    const totalVal = drinksRev + foodRev;
    const drinksPct = totalVal > 0 ? ((drinksRev / totalVal) * 100).toFixed(0) : 0;
    const foodPct = totalVal > 0 ? ((foodRev / totalVal) * 100).toFixed(0) : 0;
    
    document.getElementById('weather-advice-card').innerHTML = `
        <div class="weather-advice-header">
            <span class="advice-icon">${adviceIcon}</span>
            <h3>${adviceTitle}</h3>
        </div>
        <div class="advice-body">${adviceHTML}</div>
    `;
    
    document.getElementById('weather-sales-split').innerHTML = `
        <h3>Sales Slicing (Food vs. Drinks)</h3>
        <div class="split-stats-container">
            <div class="split-segment">
                <span class="split-label">ðŸ¹ Drinks Revenue</span>
                <span class="split-value">Â£${drinksRev.toFixed(2)}</span>
                <span class="split-sub">${drinksCount} items (${drinksPct}%)</span>
            </div>
            <div class="split-segment">
                <span class="split-label">ðŸ— Food Revenue</span>
                <span class="split-value">Â£${foodRev.toFixed(2)}</span>
                <span class="split-sub">${foodCount} items (${foodPct}%)</span>
            </div>
        </div>
        <div class="split-visual-bar">
            <div class="split-bar-drinks" style="width: ${drinksPct}%"></div>
            <div class="split-bar-food" style="width: ${foodPct}%"></div>
        </div>
    `;
}



// ==========================================
// 7.5 COMPETITOR INTELLIGENCE RENDER FUNCTIONS
// ==========================================
function renderCompetitorComparison() {
    const container = document.getElementById('competitor-comparison-results');
    if (!container) return;
    
    const searchInput = document.getElementById('comp-item-search');
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    // Filter competitor products
    const filtered = COMPETITOR_MENUS.filter(item => {
        return item.name.toLowerCase().includes(searchVal) || item.category.toLowerCase().includes(searchVal);
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 30px 0; border: 1px dashed rgba(255,255,255,0.05); border-radius: 8px;">
                ðŸ” No comparable street items match "${searchVal}". Try "Red Stripe", "Jerk", or "Punch".
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(item => {
        // Calculate street average
        const competitors = [item.larkins, item.piper, item.boardwalk, item.xanadu].filter(v => v !== null && v !== undefined);
        const streetAvg = competitors.reduce((sum, v) => sum + v, 0) / competitors.length;
        const priceDiff = item.roots - streetAvg;
        const pctDiff = (priceDiff / streetAvg) * 100;
        
        let deviationHTML = "";
        if (Math.abs(pctDiff) < 1.5) {
            deviationHTML = `<span class="comp-badge flat" style="padding: 3px 8px; font-size:11px;">Market Parity</span>`;
        } else if (pctDiff < 0) {
            deviationHTML = `<span class="comp-badge up" style="padding: 3px 8px; font-size:11px;">Roots Cheaper (-${Math.abs(pctDiff).toFixed(0)}%)</span>`;
        } else {
            deviationHTML = `<span class="comp-badge down" style="background: rgba(255, 94, 54, 0.1); color: var(--sunset-orange); border: 1px solid rgba(255, 94, 54, 0.2); padding: 3px 8px; font-size:11px;">Premium (+${pctDiff.toFixed(0)}%)</span>`;
        }
        
        return `
            <div class="kpi-card" style="margin-bottom: 15px; border-left: 3px solid var(--sunset-orange); background: rgba(255,255,255,0.01); padding: 18px 20px; border-top: 1px solid rgba(255,255,255,0.02); border-right: 1px solid rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="font-size: 15px; font-weight: 700; color: white;">${item.name}</h4>
                        <span class="category-pill" style="margin-top: 4px; display: inline-block;">${item.category}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-family: var(--font-tech); font-weight: 700; font-size: 18px; color: var(--palm-green);">Â£${item.roots.toFixed(2)}</div>
                        <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Roots Price</div>
                    </div>
                </div>
                
                <!-- Venue comparison row -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 12px; text-align: center;">
                    <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                        <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Larkins</div>
                        <div style="font-family: var(--font-tech); font-weight: 600; font-size: 12px; margin-top: 3px; color: white;">${item.larkins ? 'Â£' + item.larkins.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                        <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Piper</div>
                        <div style="font-family: var(--font-tech); font-weight: 600; font-size: 12px; margin-top: 3px; color: white;">${item.piper ? 'Â£' + item.piper.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                        <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Boardwalk</div>
                        <div style="font-family: var(--font-tech); font-weight: 600; font-size: 12px; margin-top: 3px; color: white;">${item.boardwalk ? 'Â£' + item.boardwalk.toFixed(2) : 'N/A'}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px;">
                        <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Xanadu</div>
                        <div style="font-family: var(--font-tech); font-weight: 600; font-size: 12px; margin-top: 3px; color: white;">${item.xanadu ? 'Â£' + item.xanadu.toFixed(2) : 'N/A'}</div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 11px; background: rgba(0,0,0,0.15); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.02);">
                    <span style="color: var(--text-muted);">Street Average benchmark: <strong style="color: white;">Â£${streetAvg.toFixed(2)}</strong></span>
                    ${deviationHTML}
                </div>
            </div>
        `;
    }).join('');
}

function renderCategoryIndexGauges() {
    const gaugeContainer = document.getElementById('category-index-gauges');
    if (!gaugeContainer) return;
    
    const categories = ["Cocktails", "Draught Beer", "Mains", "Lite Bites", "Soft Drinks"];
    
    gaugeContainer.innerHTML = categories.map(cat => {
        const items = COMPETITOR_MENUS.filter(item => item.category === cat);
        if (items.length === 0) return '';
        
        let rootsSum = 0;
        let streetAvgSum = 0;
        
        items.forEach(item => {
            rootsSum += item.roots;
            const comps = [item.larkins, item.piper, item.boardwalk, item.xanadu].filter(v => v !== null && v !== undefined);
            const streetAvg = comps.reduce((sum, v) => sum + v, 0) / comps.length;
            streetAvgSum += streetAvg;
        });
        
        const rootsAvg = rootsSum / items.length;
        const streetAvg = streetAvgSum / items.length;
        const indexVal = (rootsAvg / streetAvg) * 100;
        
        // Color formatting
        let indexColor = "var(--sunset-orange)";
        let stateText = "Premium Position";
        if (indexVal < 98) {
            indexColor = "var(--palm-green)";
            stateText = "Highly Competitive";
        } else if (indexVal <= 102) {
            indexColor = "var(--ocean-blue)";
            stateText = "Market Parity";
        }
        
        return `
            <div style="background: rgba(0,0,0,0.15); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
                    <span style="font-weight: 600;">${cat} <span style="font-size: 10px; color: var(--text-muted); font-weight: normal; margin-left: 5px;">(${stateText})</span></span>
                    <span style="font-family: var(--font-tech); font-weight: 700; color: ${indexColor};">${indexVal.toFixed(0)}%</span>
                </div>
                <div style="height: 6px; width: 100%; background: rgba(255,255,255,0.02); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; background: ${indexColor}; border-radius: 3px; width: ${Math.min(indexVal, 100)}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function generatePricingRecommendations(filteredSales) {
    const container = document.getElementById('pricing-recommendations');
    if (!container) return;
    
    // Count sales per product in the selected range
    const productSalesCounts = {};
    filteredSales.forEach(item => {
        if (item.type && item.type.toLowerCase() === 'void') return;
        if (item.productName) {
            productSalesCounts[item.productName] = (productSalesCounts[item.productName] || 0) + 1;
        }
    });
    
    // Sort sales to identify top sellers
    const sortedProductSales = Object.keys(productSalesCounts).map(name => ({
        name,
        count: productSalesCounts[name]
    })).sort((a, b) => b.count - a.count);
    
    const topSellersNames = sortedProductSales.slice(0, 3).map(x => x.name);
    
    let recs = [];
    
    COMPETITOR_MENUS.forEach(item => {
        const comps = [item.larkins, item.piper, item.boardwalk, item.xanadu].filter(v => v !== null && v !== undefined);
        if (comps.length === 0) return;
        const streetAvg = comps.reduce((sum, v) => sum + v, 0) / comps.length;
        const salesCount = productSalesCounts[item.name] || 0;
        
        if (salesCount > 0) {
            // Roots is cheaper than street average -> recommend price hike
            if (item.roots < streetAvg) {
                // Smart pricing formula ending in .45 or .95
                let newPrice = Math.ceil(streetAvg * 2) / 2 - 0.05;
                
                // Clamp target price to max 15% increase to keep recommendations realistic
                const maxPrice = item.roots * 1.15;
                if (newPrice > maxPrice) {
                    newPrice = Math.round(maxPrice * 2) / 2 - 0.05;
                    // Ensure newPrice is still higher than current roots price
                    if (newPrice <= item.roots) {
                        newPrice = item.roots + 0.50; // simple fallback increment
                    }
                }
                
                const diff = newPrice - item.roots;
                if (diff > 0.05) {
                    const rangeProfit = salesCount * diff;
                    const isVolumeLeader = topSellersNames.includes(item.name);
                    
                    if (isVolumeLeader) {
                        recs.push({
                            type: "volume_up",
                            item: item.name,
                            currentPrice: item.roots,
                            targetPrice: newPrice,
                            streetAvg: streetAvg,
                            sales: salesCount,
                            profit: rangeProfit,
                            text: `ðŸ† <strong>Volume Leader Opportunity:</strong> Raise <strong>${item.name}</strong> from Â£${item.roots.toFixed(2)} to Â£${newPrice.toFixed(2)} (Street Avg: Â£${streetAvg.toFixed(2)}). As one of your top sellers (<strong>${salesCount} sold</strong>), this captures <span class="text-palm-green"><strong>+Â£${rangeProfit.toFixed(2)}</strong></span> in high-probability margin.`
                        });
                    } else {
                        recs.push({
                            type: "up",
                            item: item.name,
                            currentPrice: item.roots,
                            targetPrice: newPrice,
                            streetAvg: streetAvg,
                            sales: salesCount,
                            profit: rangeProfit,
                            text: `ðŸ“ˆ <strong>Price Optimization:</strong> Raise <strong>${item.name}</strong> from Â£${item.roots.toFixed(2)} to Â£${newPrice.toFixed(2)} (Street Avg: Â£${streetAvg.toFixed(2)}). With <strong>${salesCount}</strong> units sold, this captures <span class="text-palm-green"><strong>+Â£${rangeProfit.toFixed(2)}</strong></span> extra margin.`
                        });
                    }
                }
            }
            
            // Roots is significantly more expensive than street average -> alert premium risk
            if (item.roots > streetAvg * 1.12) {
                recs.push({
                    type: "warning",
                    item: item.name,
                    currentPrice: item.roots,
                    streetAvg: streetAvg,
                    sales: salesCount,
                    text: `âš ï¸ <strong>Premium Price Risk:</strong> <strong>${item.name}</strong> is Â£${item.roots.toFixed(2)} (<strong>+${((item.roots - streetAvg)/streetAvg*100).toFixed(0)}%</strong> vs. Street Avg Â£${streetAvg.toFixed(2)}). Ensure high service standard (<strong>${salesCount} sold</strong>).`
                });
            }
        }
    });
    
    // Sort recommendations: volume_up first, then up (by profit desc), then warnings
    recs.sort((a, b) => {
        if (a.type === 'volume_up' && b.type !== 'volume_up') return -1;
        if (b.type === 'volume_up' && a.type !== 'volume_up') return 1;
        if ((a.type === 'up' || a.type === 'volume_up') && b.type === 'warning') return -1;
        if (a.type === 'warning' && (b.type === 'up' || b.type === 'volume_up')) return 1;
        return (b.profit || 0) - (a.profit || 0);
    });
    
    if (recs.length === 0) {
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); padding: 12px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04); font-size: 13px; color: var(--text-muted);">
                ðŸ’¡ Roots prices align well with street averages. No active margin optimization adjustments needed.
            </div>
        `;
        return;
    }
    
    container.innerHTML = recs.slice(0, 3).map(rec => {
        let borderStyle = 'border-left: 3px solid var(--sunset-orange);';
        let bgStyle = 'background: rgba(255, 94, 54, 0.04);';
        if (rec.type === 'volume_up') {
            borderStyle = 'border-left: 3px solid var(--palm-green); border-right: 1px solid rgba(0, 255, 135, 0.1); border-top: 1px solid rgba(0, 255, 135, 0.1); border-bottom: 1px solid rgba(0, 255, 135, 0.1);';
            bgStyle = 'background: rgba(0, 255, 135, 0.06);';
        } else if (rec.type === 'up') {
            borderStyle = 'border-left: 3px solid var(--palm-green);';
            bgStyle = 'background: rgba(0, 255, 135, 0.04);';
        }
        return `
            <div style="${bgStyle} ${borderStyle} padding: 12px 15px; border-radius: 8px; font-size: 12px; line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.02); border-right: 1px solid rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.02);">
                ${rec.text}
            </div>
        `;
    }).join('');
}

function renderCompetitorOffers() {
    const container = document.getElementById('competitor-offers-list');
    if (!container) return;
    
    container.innerHTML = COMPETITOR_OFFERS.map(item => {
        let badgeClass = "impact-medium";
        if (item.threat === 'High') {
            badgeClass = "impact-extreme";
        } else if (item.threat === 'Medium') {
            badgeClass = "impact-high";
        }
        
        return `
            <div class="event-card" style="padding: 15px; background: rgba(0,0,0,0.15); border-radius: 8px; border: 1px solid rgba(255,255,255,0.02); display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">
                    <strong style="color: var(--sunset-orange); font-size: 13px;">${item.venue}</strong>
                    <span class="impact-badge ${badgeClass}" style="font-size: 9px; padding: 2px 6px;">${item.threat} Threat</span>
                </div>
                <div style="font-size: 12px; font-weight: 600; color: white;">${item.offer}</div>
                <p style="font-size: 11px; color: var(--text-muted); line-height: 1.3;">${item.details}</p>
                <div style="margin-top: 4px; font-size: 11px; padding: 8px 10px; background: rgba(255, 94, 54, 0.05); border-left: 2px solid var(--sunset-orange); border-radius: 4px; line-height: 1.3;">
                    <strong>ðŸ›¡ï¸ Strategy:</strong> ${item.counter}
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// 8. WEATHER API FETCH
// ==========================================
async function fetchLiveHullWeather() {
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=53.7443&longitude=-0.3325&current=temperature_2m,weather_code");
        const data = await res.json();
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;
        
        let condition = "Fine Cloud";
        if (code === 0) condition = "â˜€ï¸ Clear Skies";
        else if (code >= 1 && code <= 3) condition = "â›… Partly Cloudy";
        else if (code >= 51 && code <= 65) condition = "ðŸŒ§ï¸ Drizzle & Rain";
        else condition = "â˜ï¸ Overcast";

        document.getElementById('hull-temp').textContent = `${temp}Â°C`;
        document.getElementById('hull-cond').textContent = `${condition} on Newland Ave`;
    } catch (e) {
        document.getElementById('hull-temp').textContent = "--Â°C";
        document.getElementById('hull-cond').textContent = "â˜ï¸ Skies over Hull";
    }
}

// ==========================================
// 9. NEW ADVANCED INTERACTIVE INTEGRATIONS
// ==========================================

function getWeatherForDate(dateStr) {
    if (!dateStr) return "Moderate";
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % 4;
    const weatherTypes = ["Warm", "Moderate", "Rainy", "Cold"];
    return weatherTypes[index];
}

function getDaypart(timestamp) {
    if (!timestamp || !timestamp.includes(' ')) return "Lunch";
    const timePart = timestamp.split(' ')[1];
    const hour = parseInt(timePart.split(':')[0]);
    if (hour >= 12 && hour < 17) return "Lunch";
    if (hour >= 17 && hour < 21) return "Dinner";
    return "Late Night";
}

function getProductEmoji(name, category) {
    const n = name.toLowerCase();
    const c = (category || "").toLowerCase();
    if (n.includes("rum") || n.includes("punch") || n.includes("zombie") || n.includes("colada") || n.includes("marley")) return "ðŸ¹";
    if (n.includes("red stripe") || n.includes("pint") || n.includes("beer") || n.includes("cruz campo") || n.includes("draught")) return "ðŸº";
    if (n.includes("corona") || n.includes("bottle")) return "ðŸ¾";
    if (n.includes("coke") || n.includes("water") || n.includes("soft") || n.includes("soda") || n.includes("juice")) return "ðŸ¥¤";
    if (n.includes("chicken") || n.includes("jerk") || n.includes("curry") || n.includes("goat") || n.includes("mutton") || n.includes("pot") || n.includes("pit")) return "ðŸ—";
    if (n.includes("fries") || n.includes("chips")) return "ðŸŸ";
    if (n.includes("mac") || n.includes("cheese") || n.includes("balls") || n.includes("bites") || n.includes("squid") || n.includes("ribs")) return "ðŸ§†";
    if (c.includes("cocktail")) return "ðŸ¹";
    if (c.includes("draught") || c.includes("beer")) return "ðŸº";
    if (c.includes("bottle")) return "ðŸ¾";
    if (c.includes("soft")) return "ðŸ¥¤";
    if (c.includes("main") || c.includes("classic") || c.includes("pot") || c.includes("pit")) return "ðŸ½ï¸";
    if (c.includes("bite") || c.includes("fixin") || c.includes("side")) return "ðŸ§†";
    return "ðŸ½ï¸";
}

function setProductSort(column) {
    if (productSortColumn === column) {
        productSortAsc = !productSortAsc;
    } else {
        productSortColumn = column;
        productSortAsc = false;
        if (column === 'name' || column === 'category') {
            productSortAsc = true;
        }
    }
    renderExtendedProductTab();
}

function sortProductList(items, column, ascending, totalQty) {
    items.sort((a, b) => {
        let valA, valB;
        if (column === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else if (column === 'category') {
            valA = a.category.toLowerCase();
            valB = b.category.toLowerCase();
        } else if (column === 'qty') {
            valA = a.qty;
            valB = b.qty;
        } else if (column === 'revenue') {
            valA = a.revenue;
            valB = b.revenue;
        } else if (column === 'slicing') {
            valA = totalQty > 0 ? a.qty / totalQty : 0;
            valB = totalQty > 0 ? b.qty / totalQty : 0;
        }
        
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });
}

function updateSortHeadersUI() {
    const cols = ['name', 'category', 'qty', 'revenue', 'slicing'];
    cols.forEach(col => {
        const span = document.getElementById(`sort-icon-${col}`);
        if (!span) return;
        if (productSortColumn === col) {
            span.textContent = productSortAsc ? " â–²" : " â–¼";
            span.style.color = "var(--sunset-orange)";
        } else {
            span.textContent = "";
        }
    });
}

function toggleCategoryGroup(groupId) {
    const rows = document.querySelectorAll(`.${groupId}`);
    const arrow = document.getElementById(`arrow-${groupId}`);
    if (rows.length === 0) return;
    
    const isHidden = rows[0].style.display === 'none';
    rows.forEach(row => {
        row.style.display = isHidden ? '' : 'none';
    });
    
    if (arrow) {
        arrow.style.transform = isHidden ? '' : 'rotate(-90deg)';
    }
}



// RENDER REVIEWS & SOCIALS TAB
function renderReviewsTab() {
    renderReviewsFeed();
    renderSentimentCloud();
}

function renderReviewsFeed() {
    const list = document.getElementById('social-reviews-list');
    if (!list) return;
    
    const filtered = GUEST_REVIEWS.filter(rev => {
        if (!activeReviewTag) return true;
        return rev.tags.includes(activeReviewTag);
    });
    
    if (filtered.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px 0;">No reviews match the selected tag.</div>`;
        return;
    }
    
    list.innerHTML = filtered.map(rev => {
        const stars = "â˜…".repeat(rev.rating) + "â˜†".repeat(5 - rev.rating);
        const sourceBadge = rev.source === 'Google' 
            ? `<span style="background: rgba(0, 212, 255, 0.15); color: var(--ocean-blue); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid rgba(0, 212, 255, 0.25);">Google</span>` 
            : `<span style="background: rgba(0, 255, 135, 0.15); color: var(--palm-green); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid rgba(0, 255, 135, 0.25);">TripAdvisor</span>`;
            
        return `
            <div class="review-card">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <strong style="color: white; font-size: 14px;">${rev.author}</strong>
                        ${sourceBadge}
                    </div>
                    <div style="font-family: monospace; font-size: 12px; color: var(--text-muted);">${rev.date}</div>
                </div>
                <div style="color: var(--sunset-orange); font-size: 14px; letter-spacing: 1px;">${stars}</div>
                <p style="font-size: 13px; color: var(--text-light); line-height: 1.4; font-style: italic;">"${rev.text}"</p>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                    ${rev.tags.map(t => `<span class="category-pill" style="font-size: 9px; padding: 2px 6px; cursor: pointer;" onclick="filterReviewsByTag('${t}')">${t}</span>`).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function renderSentimentCloud() {
    const cloud = document.getElementById('sentiment-word-cloud');
    if (!cloud) return;
    
    cloud.innerHTML = SENTIMENT_WORDS.map(tag => {
        const cls = tag.sentiment === 'positive' ? 'pos' : 'neg';
        const activeCls = activeReviewTag === tag.word ? 'active' : '';
        const fontSize = 10 + Math.min(tag.count * 0.3, 10);
        
        return `
            <span class="sentiment-tag ${cls} ${activeCls}" data-tag="${tag.word}" style="font-size: ${fontSize}px;" onclick="filterReviewsByTag('${tag.word}')">
                ${tag.word} (${tag.count})
                <strong style="font-size: 9px; opacity: 0.85;">${tag.score}</strong>
            </span>
        `;
    }).join('');
}

function filterReviewsByTag(tag) {
    if (activeReviewTag === tag) {
        activeReviewTag = null; // Toggle filter off if clicked again
    } else {
        activeReviewTag = tag;
    }
    const indicator = document.getElementById('cloud-filter-indicator');
    const tagName = document.getElementById('active-tag-name');
    if (activeReviewTag) {
        if (indicator) indicator.classList.remove('hidden');
        if (tagName) tagName.textContent = activeReviewTag;
    } else {
        if (indicator) indicator.classList.add('hidden');
    }
    renderReviewsTab();
}

function clearCloudFilter() {
    activeReviewTag = null;
    const indicator = document.getElementById('cloud-filter-indicator');
    if (indicator) indicator.classList.add('hidden');
    renderReviewsTab();
}

// ==========================================
// 10. WEEKLY TRENDS & SELLER DEEP-DIVE INSIGHTS
// ==========================================

function changeChartView(view) {
    activeChartView = view;
    
    document.getElementById('chart-view-hourly')?.classList.remove('active');
    document.getElementById('chart-view-daily')?.classList.remove('active');
    document.getElementById('chart-view-dayofweek')?.classList.remove('active');
    
    if (view === 'hourly') {
        document.getElementById('chart-view-hourly')?.classList.add('active');
    } else if (view === 'daily') {
        document.getElementById('chart-view-daily')?.classList.add('active');
    } else {
        document.getElementById('chart-view-dayofweek')?.classList.add('active');
    }
    
    processAndRender();
}

function renderWeeklyTrends() {
    const satList = document.getElementById('sat-trends-list');
    const rankingsList = document.getElementById('day-rankings-list');
    if (!satList || !rankingsList) return;

    // 1. Calculate Saturday Trend
    const satData = {};
    salesData.forEach(item => {
        if (item.type && item.type.toLowerCase() === 'void') return;
        if (!item.timestamp) return;
        const datePart = parseDateToYYYYMMDD(item.timestamp);
        const dateObj = new Date(datePart);
        if (dateObj.getDay() === 6) { // Saturday
            satData[datePart] = (satData[datePart] || 0) + item.price;
        }
    });
    
    const sortedSats = Object.entries(satData).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3);
    
    if (sortedSats.length === 0) {
        satList.innerHTML = `<li style="color: var(--text-muted);">No Saturday data available.</li>`;
    } else {
        satList.innerHTML = sortedSats.map(([dateStr, rev], idx) => {
            const parts = dateStr.split('-');
            const dateObj = new Date(parts[0], parts[1]-1, parts[2]);
            const formatted = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
            
            let changeHTML = "";
            if (idx + 1 < sortedSats.length) {
                const prevRev = sortedSats[idx + 1][1];
                const pct = prevRev > 0 ? ((rev - prevRev) / prevRev) * 100 : 0;
                const sign = pct >= 0 ? "+" : "";
                const color = pct >= 0 ? "var(--palm-green)" : "var(--error-red)";
                changeHTML = `<span style="font-family: var(--font-tech); font-weight: bold; color: ${color}; margin-left: 10px;">${sign}${pct.toFixed(0)}%</span>`;
            } else {
                changeHTML = `<span style="color: var(--text-muted); font-size:10px; margin-left:10px;">(Base)</span>`;
            }
            
            return `
                <li style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.02);">
                    <strong>${formatted}</strong>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-family: var(--font-tech); color: white; font-weight: bold;">Â£${rev.toFixed(2)}</span>
                        ${changeHTML}
                    </div>
                </li>
            `;
        }).join('');
    }

    // 2. Day-of-Week Average Rankings
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayRevenues = {};
    
    salesData.forEach(item => {
        if (item.type && item.type.toLowerCase() === 'void') return;
        if (!item.timestamp) return;
        const dateStr = parseDateToYYYYMMDD(item.timestamp);
        const dayIndex = new Date(dateStr).getDay();
        const dayName = daysOfWeek[dayIndex];
        
        if (!dayRevenues[dayName]) dayRevenues[dayName] = {};
        dayRevenues[dayName][dateStr] = (dayRevenues[dayName][dateStr] || 0) + item.price;
    });

    const dayAverages = [];
    daysOfWeek.forEach(day => {
        const datesObj = dayRevenues[day] || {};
        const values = Object.values(datesObj);
        const sum = values.reduce((s, v) => s + v, 0);
        const count = values.length || 1;
        dayAverages.push({ day, avg: sum / count });
    });

    dayAverages.sort((a, b) => b.avg - a.avg);
    const maxAvg = dayAverages[0]?.avg || 1;

    rankingsList.innerHTML = dayAverages.slice(0, 4).map((d, index) => {
        const widthPct = Math.min(100, (d.avg / maxAvg) * 100);
        const barColor = index === 0 ? "var(--sunset-orange)" : "var(--ocean-blue)";
        return `
            <div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
                    <span style="font-weight: 600; color: white;">${d.day}</span>
                    <span style="font-family: var(--font-tech); color: var(--text-muted);">Avg: Â£${d.avg.toFixed(0)}</span>
                </div>
                <div style="height: 5px; width: 100%; background: rgba(255,255,255,0.02); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; background: ${barColor}; border-radius: 3px; width: ${widthPct}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSellerDeepDiveInsights() {
    const feed = document.getElementById('item-deep-dive-feed');
    if (!feed) return;

    const start = document.getElementById('date-start').value;
    const end = document.getElementById('date-end').value;
    const filtered = salesData.filter(item => {
        if (!item.timestamp) return false;
        const d = parseDateToYYYYMMDD(item.timestamp);
        return d >= start && d <= end;
    });

    const productCounts = {};
    const productRevenues = {};
    const productCategories = {};
    const productVoids = {};
    const productPrices = {};

    filtered.forEach(item => {
        if (!item.productName) return;
        const isVoid = item.type && item.type.toLowerCase() === 'void';
        
        if (!productPrices[item.productName]) {
            productPrices[item.productName] = item.price;
        }

        if (isVoid) {
            productVoids[item.productName] = (productVoids[item.productName] || 0) + 1;
            return;
        }

        productCounts[item.productName] = (productCounts[item.productName] || 0) + 1;
        productRevenues[item.productName] = (productRevenues[item.productName] || 0) + item.price;
        productCategories[item.productName] = item.category || "Other";
    });

    const items = Object.keys(productCounts).map(name => ({
        name,
        qty: productCounts[name] || 0,
        revenue: productRevenues[name] || 0,
        category: productCategories[name] || "Other",
        voids: productVoids[name] || 0,
        price: productPrices[name] || 0
    }));

    if (items.length === 0) {
        feed.innerHTML = `<p style="color: var(--text-muted); text-align: center;">No product sales recorded in this range.</p>`;
        return;
    }

    const topSellers = [...items].sort((a, b) => b.qty - a.qty).slice(0, 5);
    
    // EXCLUDE LOW-VALUE STAPLES (under Â£4.00) from Slowest Movers to keep insights meaningful
    const candidatesForSlowest = items.filter(item => item.price >= 4.00);
    const worstSellers = candidatesForSlowest.length > 0 
        ? [...candidatesForSlowest].sort((a, b) => a.qty - b.qty).slice(0, 5)
        : [...items].sort((a, b) => a.qty - b.qty).slice(0, 5);

    let html = "";

    if (topSellers[0]) {
        const top = topSellers[0];
        const emoji = getProductEmoji(top.name, top.category);
        html += `
            <div style="background: rgba(0, 255, 135, 0.04); border-left: 3px solid var(--palm-green); padding: 10px 12px; border-radius: 6px; line-height: 1.4;">
                ðŸ”¥ <strong>#1 Best Seller: ${emoji} ${top.name}</strong><br>
                Sold <strong>${top.qty}</strong> units yielding <strong>Â£${top.revenue.toFixed(2)}</strong>. Strongest performance vector in the dataset. Keep high prep levels.
            </div>
        `;
    }

    if (topSellers[1]) {
        const runnerUp = topSellers[1];
        const emoji = getProductEmoji(runnerUp.name, runnerUp.category);
        html += `
            <div style="background: rgba(0, 212, 255, 0.04); border-left: 3px solid var(--ocean-blue); padding: 10px 12px; border-radius: 6px; line-height: 1.4;">
                ðŸ“ˆ <strong>Upsell Target: ${emoji} ${runnerUp.name}</strong><br>
                High transaction attachment rate (<strong>${runnerUp.qty} sold</strong>). Bundle with sides or cocktails during peak dinner shifts.
            </div>
        `;
    }

    if (worstSellers[0]) {
        const worst = worstSellers[0];
        const emoji = getProductEmoji(worst.name, worst.category);
        
        let slowestMoverAdvice = "";
        const cat = worst.category.toLowerCase();
        if (cat.includes("cocktail")) {
            slowestMoverAdvice = "Promote as a Happy Hour feature or combine into a 2-for-1 menu option.";
        } else if (cat.includes("draught") || cat.includes("beer") || cat.includes("bottle")) {
            slowestMoverAdvice = "Run a mid-week burger-and-beer deal or review storage temperatures.";
        } else if (cat.includes("mains") || cat.includes("pit") || cat.includes("pot") || cat.includes("classic")) {
            slowestMoverAdvice = "Offer as part of a meal deal combo or audit kitchen execution times.";
        } else {
            slowestMoverAdvice = "Review pricing parity on the street or consider swapping with seasonal alternatives.";
        }
        
        html += `
            <div style="background: rgba(255, 51, 102, 0.04); border-left: 3px solid var(--error-red); padding: 10px 12px; border-radius: 6px; line-height: 1.4;">
                âš ï¸ <strong>Slowest Mover: ${emoji} ${worst.name}</strong><br>
                Only <strong>${worst.qty}</strong> units sold in active period. ${slowestMoverAdvice}
            </div>
        `;
    }

    // Wastage Warning: Find the item with the highest void ratio (minimum 2 voids)
    const voidItems = items.filter(item => item.voids >= 2);
    voidItems.forEach(item => {
        item.voidRatio = item.voids / (item.qty + item.voids);
    });
    voidItems.sort((a, b) => b.voidRatio - a.voidRatio);
    const highVoidItem = voidItems[0];
    
    if (highVoidItem) {
        const emoji = getProductEmoji(highVoidItem.name, highVoidItem.category);
        const voidPct = (highVoidItem.voidRatio * 100).toFixed(0);
        html += `
            <div style="background: rgba(255, 94, 54, 0.04); border-left: 3px solid var(--sunset-orange); padding: 10px 12px; border-radius: 6px; line-height: 1.4;">
                ðŸš¨ <strong>Wastage Warning: ${emoji} ${highVoidItem.name}</strong><br>
                Logged <strong>${highVoidItem.voids} voids</strong> relative to sales (<strong>${voidPct}% void-to-sale ratio</strong>). Inspect kitchen prep issues or POS entry compliance.
            </div>
        `;
    } else if (worstSellers[1]) {
        const worst2 = worstSellers[1];
        const emoji = getProductEmoji(worst2.name, worst2.category);
        html += `
            <div style="background: rgba(255, 94, 54, 0.04); border-left: 3px solid var(--sunset-orange); padding: 10px 12px; border-radius: 6px; line-height: 1.4;">
                ðŸ’¡ <strong>Menu Optimization: ${emoji} ${worst2.name}</strong><br>
                Low sales volume (<strong>${worst2.qty} sold</strong>). Promote through mid-week combos or social campaigns.
            </div>
        `;
    }

    feed.innerHTML = html;
}

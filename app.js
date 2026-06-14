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

        // Hull Local Events Dataset
        const HULL_EVENTS = [
            {
                date: "2026-06-14",
                name: "Newland Avenue Street Festival",
                location: "Newland Ave (Right outside!)",
                impact: "Extreme",
                time: "12:00 - 22:00",
                description: "Hull's annual Newland Ave street festival with live music, street food, and craft markets. High-density foot traffic is expected right outside Roots Rum Shack.",
                advice: "Prep: Schedule double staff on floor and bar. Pre-batch Rum Punch and stock up on Red Stripe and Cruz Campo kegs."
            },
            {
                date: "2026-06-16",
                name: "Hull KR vs St Helens Super League",
                location: "Sewell Group Craven Park",
                impact: "High",
                time: "19:45 Kickoff",
                description: "Major mid-week Super League clash. Large crowds will travel along Cottingham Road and Newland Ave pre- and post-match.",
                advice: "Prep: Anticipate post-match dinner rushes. Ensure kitchen stays open late for takeaway/dine-in orders."
            },
            {
                date: "2026-06-20",
                name: "Hull FC vs Wigan Warriors Super League",
                location: "MKM Stadium",
                impact: "High",
                time: "15:00 Kickoff",
                description: "Saturday afternoon game. Supporters will gather at local pubs on Princes and Newland Ave for pre-match drinks.",
                advice: "Prep: Staff up for early afternoon bar drinks. Promote match-day food platters and beer buckets."
            },
            {
                date: "2026-06-27",
                name: "Humber Street Sesh 2026",
                location: "Humber Street / Fruit Market",
                impact: "Extreme",
                time: "11:00 - 23:00",
                description: "Hull's largest music festival showcasing local bands. Draws over 30,000 music fans to the city center and Fruit Market area.",
                advice: "Prep: Expect city-wide dining surges. Offer festival-themed drinks and fast takeout options."
            },
            {
                date: "2026-07-04",
                name: "Pride in Hull 2026",
                location: "Queens Gardens & City Centre",
                impact: "High",
                time: "12:00 - 20:00",
                description: "Annual city-wide celebration starting with a massive parade and transitioning to live stages in the city centre. High foot-fall in surrounding restaurant corridors.",
                advice: "Prep: Decorate the shack, play upbeat reggae and calypso music, and offer rainbow-themed cocktail specials."
            },
            {
                date: "2026-10-09",
                name: "Hull Fair 2026",
                location: "Walton Street Showground",
                impact: "Extreme",
                time: "14:00 - 23:00 daily",
                description: "One of Europe's largest travelling funfairs. Draws hundreds of thousands of people to Hull over 8 days, causing major city-wide traffic and massive food-run surges.",
                advice: "Prep: Walton Street is close to Newland Ave. Massive evening surges are expected for post-fair food. Ensure plenty of Jerk Chicken is prepped."
            }
        ];

        // Competitor menu items comparison dataset
        const COMPETITOR_MENUS = [
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

        // ==========================================
        // 3. INITIALIZATION & SYNC PIPELINES
        // ==========================================
        async function initDashboard() {
            fetchLiveHullWeather();

            const syncStatus = document.getElementById('sync-status');
            const offlineAlert = document.getElementById('offline-alert');
            const debugOverlay = document.getElementById('debug-overlay');
            const debugRows = document.getElementById('debug-rows');

            try {
                const response = await fetch(`${SHEET_CSV_URL}&t=${Date.now()}`);
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
                        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
                        const tabProd = document.getElementById('tab-product-performance');
                        if (tabProd) tabProd.classList.remove('hidden');
                        document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
                        const linkProd = document.getElementById('menu-product-performance');
                        if (linkProd) linkProd.classList.add('active');
                    } else if (action === 'show_weather') {
                        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
                        const tabWeather = document.getElementById('tab-weather-trends');
                        if (tabWeather) tabWeather.classList.remove('hidden');
                        document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
                        const linkWeather = document.getElementById('menu-weather-trends');
                        if (linkWeather) linkWeather.classList.add('active');
                    } else if (action === 'show_events') {
                        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
                        const tabEvents = document.getElementById('tab-local-events');
                        if (tabEvents) tabEvents.classList.remove('hidden');
                        document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
                        const linkEvents = document.getElementById('menu-local-events');
                        if (linkEvents) linkEvents.classList.add('active');
                    } else if (action === 'show_competitors') {
                        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
                        const tabComp = document.getElementById('tab-competitor-watch');
                        if (tabComp) tabComp.classList.remove('hidden');
                        document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
                        const linkComp = document.getElementById('menu-competitor-watch');
                        if (linkComp) linkComp.classList.add('active');
                    } else if (action === 'open_drawer') {
                        toggleSidebar(true);
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
                        // Switch tab to weather-trends
                        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
                        const tabWeather = document.getElementById('tab-weather-trends');
                        if (tabWeather) tabWeather.classList.remove('hidden');
                        document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
                        const linkWeather = document.getElementById('menu-weather-trends');
                        if (linkWeather) linkWeather.classList.add('active');
                        
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
                if (action === 'test_load_sample' || action === 'show_competitors' || action === 'open_drawer') {
                    loadSampleDataFallback();
                    if (action === 'show_competitors') {
                        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
                        const tabComp = document.getElementById('tab-competitor-watch');
                        if (tabComp) tabComp.classList.remove('hidden');
                        document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
                        const linkComp = document.getElementById('menu-competitor-watch');
                        if (linkComp) linkComp.classList.add('active');
                    } else if (action === 'open_drawer') {
                        toggleSidebar(true);
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
                document.getElementById('top-category'),
                document.getElementById('hull-temp'),
                document.getElementById('hull-cond'),
                document.getElementById('product-list'),
                document.getElementById('extended-product-table-body'),
                document.getElementById('till-intelligence-body')
            ].filter(Boolean);
            
            pulseTargets.forEach(el => el.classList.add('loading-pulse'));
            
            try {
                const response = await fetch(`${SHEET_CSV_URL}&t=${Date.now()}`);
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

            const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
            document.getElementById('top-category').textContent = sortedCategories[0] ? sortedCategories[0][0] : '-';

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
            renderPeakTimesChart(hourlyRevenue, compareEnabled ? prevHourlyRevenue : null);
            renderProductRanking();
            renderExtendedProductTab();
            renderWeatherTrendsTab(totalRevenue, categoryCounts);
            
            // Inject dynamic Till Intelligence Comparative Insights
            document.getElementById('till-intelligence-body').innerHTML = generateBusinessInsights(filteredSales, prevSales, compareEnabled);
            renderLocalEventsTab();
            
            // Competitor Watch Sub-module updates
            renderCompetitorComparison();
            renderCategoryIndexGauges();
            generatePricingRecommendations(filteredSales);
            renderCompetitorOffers();
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
            document.getElementById('top-category').textContent = "-";
            
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
            
            renderLocalEventsTab();
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
            });
            
            // Calculate previous stats
            let prevRev = 0;
            let prevCount = 0;
            let prevCatCounts = {};
            
            previousSales.forEach(item => {
                if (item.type && item.type.toLowerCase() === 'void') return;
                prevRev += item.price;
                prevCount++;
                if (item.category) {
                    prevCatCounts[item.category] = (prevCatCounts[item.category] || 0) + item.price;
                }
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
            
            insights.push(`
                <li>
                    <strong>${growthSymbol} Revenue Momentum:</strong> 
                    Your net till sales show a <span class="${growthColorClass}"><strong>${Math.abs(revPct)}% ${growthDir}</strong></span> compared to the preceding period (representing an absolute revenue shift of <strong>Â£${Math.abs(revDiff).toFixed(2)}</strong>). This was accompanied by a <strong>${Math.abs(countPct)}% ${countDiff >= 0 ? 'increase' : 'decrease'}</strong> in volume of sales transactions.
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
            
            if (topGrowth && topGrowth.diff > 0) {
                const growthRatio = topGrowth.prev > 0 ? ((topGrowth.diff / topGrowth.prev) * 100).toFixed(0) : 100;
                insights.push(`
                    <li>
                        <strong>ðŸ¹ Primary Driver:</strong> 
                        The largest growth sector is <span class="text-palm-green"><strong>${topGrowth.category}</strong></span>, which grew by <strong>Â£${topGrowth.diff.toFixed(2)}</strong> (a <strong>${growthRatio}%</strong> increase). Ensure bar/kitchen supplies are stocked to match this volume shift.
                    </li>
                `);
            }
            
            if (topDecline && topDecline.diff < 0) {
                insights.push(`
                    <li>
                        <strong>âš ï¸ Category Performance Drag:</strong> 
                        Sales in <span class="text-error-red"><strong>${topDecline.category}</strong></span> dropped by <strong>Â£${Math.abs(topDecline.diff).toFixed(2)}</strong>. Review pricing strategy or consider marketing promotions to reverse this decline.
                    </li>
                `);
            }
            
            // 3. Voids analysis
            const voidPct = curRev > 0 ? ((curVoids / (curRev + curVoids)) * 100).toFixed(1) : 0;
            if (voidPct > 3) {
                insights.push(`
                    <li>
                        <strong>ðŸš¨ Void Leakage Alert:</strong> 
                        Voids represent <span class="text-error-red"><strong>${voidPct}%</strong></span> of your gross sales (<strong>Â£${curVoids.toFixed(2)}</strong> across <strong>${curVoidCount}</strong> voided entries). High voids indicate ordering mistakes or kitchen bottlenecks. Review staff order-confirmation habits.
                    </li>
                `);
            } else if (voidPct > 0) {
                insights.push(`
                    <li>
                        <strong>ðŸ”’ Voids & Wastage:</strong> 
                        Voids are currently under control at <strong>${voidPct}%</strong> of gross sales (<strong>Â£${curVoids.toFixed(2)}</strong>), which is within normal operating limits (under 3%).
                    </li>
                `);
            }
            
            // 4. AOV analysis
            const curAOV = curCount > 0 ? curRev / curCount : 0;
            const prevAOV = prevCount > 0 ? prevRev / prevCount : 0;
            const aovDiff = curAOV - prevAOV;
            if (aovDiff > 0.50) {
                insights.push(`
                    <li>
                        <strong>ðŸ’¸ Ticket Value (AOV):</strong> 
                        Your average ticket size increased to <strong>Â£${curAOV.toFixed(2)}</strong> (up <strong>Â£${aovDiff.toFixed(2)}</strong>). Customers are buying higher-value items or ordering more per check. Promote premium sides to maintain this momentum.
                    </li>
                `);
            } else if (aovDiff < -0.50) {
                insights.push(`
                    <li>
                        <strong>ðŸ·ï¸ Ticket Value Shift:</strong> 
                        Your average ticket size dropped to <strong>Â£${curAOV.toFixed(2)}</strong> (down <strong>Â£${Math.abs(aovDiff).toFixed(2)}</strong>). Try upselling starters or rum pairings to boost average check size.
            </li>
        `);
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
function renderPeakTimesChart(currentHourlyData, previousHourlyData) {
    const ctx = document.getElementById('peakTimesChart').getContext('2d');
    if (peakChart) peakChart.destroy(); 

    // Create glowing neon sunset orange gradient for current sales
    const currentGradient = ctx.createLinearGradient(0, 0, 0, 300);
    currentGradient.addColorStop(0, 'rgba(255, 94, 54, 0.95)');
    currentGradient.addColorStop(1, 'rgba(255, 26, 64, 0.3)');

    // Create glowing neon blue/cyan gradient for comparison sales
    const previousGradient = ctx.createLinearGradient(0, 0, 0, 300);
    previousGradient.addColorStop(0, 'rgba(0, 212, 255, 0.9)');
    previousGradient.addColorStop(1, 'rgba(0, 80, 192, 0.15)');

    const datasets = [{
        label: 'Selected Period (Â£)',
        data: currentHourlyData,
        backgroundColor: currentGradient,
        borderColor: 'rgba(255, 94, 54, 0.8)',
        borderWidth: 1,
        borderRadius: 8,
        order: 1
    }];

    if (previousHourlyData) {
        datasets.push({
            label: 'Previous Period (Â£)',
            data: previousHourlyData,
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
            labels: Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`),
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
    const searchVal = document.getElementById('product-search').value.toLowerCase();
    const categoryVal = document.getElementById('product-category-filter').value;
    
    const items = Object.values(productMetrics);
    if (items.length === 0) return;
    
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    items.sort((a, b) => b.revenue - a.revenue);
    
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchVal);
        const matchesCategory = categoryVal === 'all' || item.category === categoryVal;
        return matchesSearch && matchesCategory;
    });
    
    // Populate select element filter options dynamically once
    const categorySelect = document.getElementById('product-category-filter');
    if (categorySelect.options.length === 1) {
        const categories = [...new Set(items.map(item => item.category))].filter(Boolean);
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
        });
    }
    
    if (filteredItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px 0;">No products match search criteria.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filteredItems.map(item => {
        const pct = totalQty > 0 ? ((item.qty / totalQty) * 100).toFixed(1) : '0.0';
        return `
            <tr>
                <td><strong>${item.name}</strong></td>
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
                <li>ðŸ—“ï¸ <strong>Event Check:</strong> Cross-reference the Hull Local Events tab for any localized crowds today.</li>
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

// Local Hull Events Tab
function renderLocalEventsTab() {
    const listContainer = document.getElementById('events-list-container');
    const alertBanner = document.getElementById('dashboard-event-alert');
    const systemToday = getSystemTodayStr();
    
    const startDate = parseDateToYYYYMMDD(document.getElementById('date-start').value);
    const endDate = parseDateToYYYYMMDD(document.getElementById('date-end').value);
    
    const rangeEvent = HULL_EVENTS.find(e => {
        const evDate = parseDateToYYYYMMDD(e.date);
        return evDate >= startDate && evDate <= endDate;
    });
    
    if (rangeEvent) {
        alertBanner.classList.remove('hidden');
        document.getElementById('banner-event-name').textContent = rangeEvent.name;
        document.getElementById('banner-event-loc').textContent = rangeEvent.location;
        document.getElementById('banner-event-impact').textContent = `${rangeEvent.impact} Impact`;
        
        const impactSpan = document.getElementById('banner-event-impact');
        impactSpan.className = 'impact-badge';
        impactSpan.classList.add(`impact-${rangeEvent.impact.toLowerCase()}`);
    } else {
        alertBanner.classList.add('hidden');
    }
    
    // Build the list of all events
    listContainer.innerHTML = HULL_EVENTS.map(event => {
        const evDate = parseDateToYYYYMMDD(event.date);
        const isToday = evDate === systemToday;
        const isSelectedRange = evDate >= startDate && evDate <= endDate;
        
        const impactClass = `impact-${event.impact.toLowerCase()}`;
        const todayAlertTag = isToday ? `<span class="alert-today">ðŸš¨ HAPPENING TODAY</span>` : '';
        const highlightedClass = isSelectedRange ? 'event-card-highlighted' : '';
        
        const dateParts = event.date.split('-');
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-GB', options);
        
        return `
            <div class="event-card ${highlightedClass}">
                <div class="event-card-header">
                    <div>
                        <span class="event-date">${formattedDate}</span>
                        ${todayAlertTag}
                    </div>
                    <span class="impact-badge ${impactClass}">${event.impact} Impact</span>
                </div>
                <h4 class="event-title">${event.name}</h4>
                <p class="event-loc">ðŸ“ Location: <strong>${event.location}</strong> | â° Time: <strong>${event.time}</strong></p>
                <p class="event-desc">${event.description}</p>
                <div class="event-advice">
                    <strong>ðŸ’¡ Operations Advice:</strong> ${event.advice}
                </div>
            </div>
        `;
    }).join('');
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
    
    let recs = [];
    
    COMPETITOR_MENUS.forEach(item => {
        const comps = [item.larkins, item.piper, item.boardwalk, item.xanadu].filter(v => v !== null && v !== undefined);
        const streetAvg = comps.reduce((sum, v) => sum + v, 0) / comps.length;
        
        // Roots is cheaper than street average -> recommend price hike
        if (item.roots < streetAvg) {
            const salesCount = productSalesCounts[item.name] || 0;
            if (salesCount > 0) {
                const newPrice = Math.floor(streetAvg * 10) / 10 + 0.95; // e.g. round to xx.95
                const diff = newPrice - item.roots;
                if (diff > 0.10) {
                    const rangeProfit = salesCount * diff;
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
        if (item.roots > streetAvg * 1.15) {
            const salesCount = productSalesCounts[item.name] || 0;
            if (salesCount > 0) {
                recs.push({
                    type: "warning",
                    item: item.name,
                    currentPrice: item.roots,
                    streetAvg: streetAvg,
                    sales: salesCount,
                    text: `âš ï¸ <strong>Premium Risk:</strong> <strong>${item.name}</strong> is Â£${item.roots.toFixed(2)} (<strong>+${((item.roots - streetAvg)/streetAvg*100).toFixed(0)}%</strong> vs. Street Avg Â£${streetAvg.toFixed(2)}). Ensure high service standard (<strong>${salesCount} sold</strong>).`
                });
            }
        }
    });
    
    // Sort recommendations by profit value (descending)
    recs.sort((a, b) => (b.profit || 0) - (a.profit || 0));
    
    if (recs.length === 0) {
        container.innerHTML = `
            <div style="background: rgba(255,255,255,0.02); padding: 12px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04); font-size: 13px; color: var(--text-muted);">
                ðŸ’¡ Roots prices align well with street averages. No active margin optimization adjustments needed.
            </div>
        `;
        return;
    }
    
    container.innerHTML = recs.slice(0, 3).map(rec => {
        const borderStyle = rec.type === 'up' ? 'border-left: 3px solid var(--palm-green);' : 'border-left: 3px solid var(--sunset-orange);';
        const bgStyle = rec.type === 'up' ? 'background: rgba(0, 255, 135, 0.04);' : 'background: rgba(255, 94, 54, 0.04);';
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

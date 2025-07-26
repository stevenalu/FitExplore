        // Variables to store exercise data and application state
        let allExercises = [];        
        let filteredExercises = [];     
        let bodyParts = new Set();     
        let equipmentTypes = new Set(); 
        let targetMuscles = new Set();  
        let apiConnected = false;       

        /*
         * Initialize dark mode based on user preference or system setting
         * Checks localStorage first for saved preference, then falls back to system preference
         */
        function initializeDarkMode() {
            const savedTheme = localStorage.getItem('theme');
            const darkModeIcon = document.getElementById('darkModeIcon');
            
            if (savedTheme) {
                // Use saved user preference from previous sessions
                if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                    darkModeIcon.textContent = '☀️';
                }
            } else {
                // Check system preference for initial theme
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                    darkModeIcon.textContent = '☀️';
                }
            }
        }

        /**
         * Toggle between dark and light mode
         * Saves user preference to localStorage for persistence across sessions
         */
        function toggleDarkMode() {
            const isDark = document.documentElement.classList.toggle('dark');
            const darkModeIcon = document.getElementById('darkModeIcon');
            
            // Update icon based on current mode
            darkModeIcon.textContent = isDark ? '☀️' : '🌙';
            // Save preference to localStorage
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        }

        /**
         * Display the how-to-use modal with usage instructions
         * Prevents background scrolling while modal is open
         */
        function showHowToUse() {
            document.getElementById('howToUseModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        /**
         * Hide the how-to-use modal
         * Restores background scrolling functionality
         */
        function hideHowToUse() {
            document.getElementById('howToUseModal').classList.add('hidden');
            document.body.style.overflow = 'auto'; // Restore scrolling
        }

        /**
         * Load exercises from the ExerciseDB API
         * This is the main function that fetches real exercise data from the API
         * Uses the provided API credentials to get comprehensive exercise database
         */
        function loadExercises() {
            try {
                // Show loading state and hide other elements for better UX
                document.getElementById('loadingIndicator').classList.remove('hidden');
                document.getElementById('errorMessage').classList.add('hidden');
                document.getElementById('exerciseGrid').classList.add('hidden');
                
                // Update status indicator to show connection attempt
                updateApiStatus('Connecting to ExerciseDB API...', 'loading');
                console.log(' Initiating API request to ExerciseDB...');

                // Create XMLHttpRequest using the exact format and credentials provided by user
                // This will fetch the complete exercise database with GIF URLs, descriptions, and metadata
                const data = null;
                const xhr = new XMLHttpRequest();
                xhr.withCredentials = true; // Required for RapidAPI CORS handling

                // Set up event listener to handle API response when ready
                xhr.addEventListener('readystatechange', function () {
                    if (this.readyState === this.DONE) {
                        console.log(' API Response received with status:', this.status);
                        console.log(' Response data length:', this.responseText ? this.responseText.length : 0);
                        
                        // Check if the API request was successful (HTTP 200)
                        if (this.status === 200) {
                            try {
                                console.log(' Parsing JSON response from ExerciseDB API...');
                                // Parse the JSON response containing all exercise data
                                const exercises = JSON.parse(this.responseText);
                                console.log(' Successfully parsed', exercises.length, 'exercises from API');
                                
                                // Validate the response structure to ensure we got exercise objects
                                // Check for required fields: name, target, bodyPart, equipment
                                if (Array.isArray(exercises) && exercises.length > 0) {
                                    const firstExercise = exercises[0];
                                    console.log('🔬 First exercise sample:', {
                                        name: firstExercise.name,
                                        target: firstExercise.target,
                                        bodyPart: firstExercise.bodyPart,
                                        equipment: firstExercise.equipment,
                                        hasGifUrl: !!firstExercise.gifUrl,
                                        gifUrl: firstExercise.gifUrl ? firstExercise.gifUrl.substring(0, 50) + '...' : 'No GIF URL'
                                    });
                                    
                                    // Mark API as connected and process the exercise data
                                    apiConnected = true;
                                    updateApiStatus(`Connected - ${exercises.length} exercises loaded`, 'success');
                                    processExerciseData(exercises);
                                } else {
                                    console.warn(' API returned empty array or invalid format');
                                    console.log(' Response preview:', this.responseText.substring(0, 200));
                                    updateApiStatus('Invalid API Response', 'error');
                                    showError();
                                }
                            } catch (parseError) {
                                console.error(' Error parsing JSON response from API:', parseError);
                                console.log(' Raw response preview:', this.responseText.substring(0, 300));
                                updateApiStatus('Response Parse Error', 'error');
                                showError();
                            }
                        } else if (this.status === 429) {
                            // Handle rate limiting specifically
                            console.error(' API rate limit exceeded (429) - Too many requests');
                            updateApiStatus('Rate Limit Exceeded', 'error');
                            showError();
                        } else if (this.status === 401 || this.status === 403) {
                            // Handle authentication errors
                            console.error(' API authentication failed:', this.status);
                            console.log(' Check API key and subscription status on RapidAPI');
                            updateApiStatus('Authentication Failed', 'error');
                            showError();
                        } else if (this.status === 0) {
                            // Handle network/CORS issues
                            console.error(' Network error or CORS issue - Status 0');
                            updateApiStatus('Network Error', 'error');
                            showError();
                        } else {
                            // Handle other HTTP errors
                            console.error(' API request failed with HTTP status:', this.status);
                            console.error(' Response text:', this.responseText);
                            updateApiStatus(`HTTP Error ${this.status}`, 'error');
                            showError();
                        }
                    }
                });

                // Configure the API request to fetch all exercises from ExerciseDB (External API)
                // Using the main exercises endpoint which returns complete exercise objects with GIF URLs
                console.log(`Configuring API request to: ${config.Endpoint}`);
                xhr.open('GET', config.Endpoint);
                
                // Set required RapidAPI headers with the provided credentials
                xhr.setRequestHeader('x-rapidapi-key', config.Key);
                xhr.setRequestHeader('x-rapidapi-host', config.Host);
                console.log(' Sending API request with proper headers...');

                // Send the request to fetch exercise data from ExerciseDB
                xhr.send(data);

            } catch (error) {
                console.error(' Error initiating API request:', error);
                updateApiStatus('Request Setup Failed', 'error');
                showError();
            }
        }

        /**
         * Process exercise data received from API
         * Extracts unique values for filters and displays exercises
         * @param {Array} exercises - Array of exercise objects from ExerciseDB API
         */
        function processExerciseData(exercises) {
            console.log(' Processing', exercises.length, 'exercises from ExerciseDB API');
            
            // Store exercises in global variables for filtering and searching
            allExercises = exercises;
            filteredExercises = [...exercises]; // Create a copy for filtering operations

            // Extract unique values for filter dropdowns from all exercises
            // This creates sets of unique body parts, equipment types, and target muscles
            exercises.forEach(exercise => {
                if (exercise.bodyPart) bodyParts.add(exercise.bodyPart);
                if (exercise.equipment) equipmentTypes.add(exercise.equipment);
                if (exercise.target) targetMuscles.add(exercise.target);
            });

            console.log(' Extracted filter options from API data:', {
                bodyParts: bodyParts.size,
                equipment: equipmentTypes.size,
                targets: targetMuscles.size
            });

            // Populate the filter dropdowns with extracted unique values
            populateFilters();
            
            // Display the exercises in the responsive grid layout
            displayExercises();
            
            // Update UI state - hide loading, show exercise grid
            document.getElementById('loadingIndicator').classList.add('hidden');
            document.getElementById('exerciseGrid').classList.remove('hidden');
            
            // Update the results counter to show number of exercises loaded
            updateResultsCount();
            
            console.log(' Exercise processing completed successfully');
        }

        /**
         * Populate filter dropdown options with unique values from exercises
         * Sorts options alphabetically for better user experience
         */
        function populateFilters() {
            // Populate body parts filter dropdown with sorted options
            const bodyPartFilter = document.getElementById('bodyPartFilter');
            [...bodyParts].sort().forEach(bodyPart => {
                const option = document.createElement('option');
                option.value = bodyPart;
                option.textContent = capitalizeWords(bodyPart);
                bodyPartFilter.appendChild(option);
            });

            // Populate equipment filter dropdown with sorted options
            const equipmentFilter = document.getElementById('equipmentFilter');
            [...equipmentTypes].sort().forEach(equipment => {
                const option = document.createElement('option');
                option.value = equipment;
                option.textContent = capitalizeWords(equipment);
                equipmentFilter.appendChild(option);
            });

            // Populate target muscle filter dropdown with sorted options
            const targetFilter = document.getElementById('targetFilter');
            [...targetMuscles].sort().forEach(target => {
                const option = document.createElement('option');
                option.value = target;
                option.textContent = capitalizeWords(target);
                targetFilter.appendChild(option);
            });
            
            console.log(' Filter dropdowns populated with options from API data');
        }

        /**
         * Capitalize the first letter of each word for better display
         * @param {string} str - String to capitalize
         * @returns {string} - Capitalized string
         */
        function capitalizeWords(str) {
            return str.split(' ')
                     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                     .join(' ');
        }

        /**
         * Filter exercises based on search input and filter selections
         * Applies multiple filters simultaneously for precise results
         */
        function filterExercises() {
            // Get current filter values from the UI elements
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            const bodyPartFilter = document.getElementById('bodyPartFilter').value;
            const equipmentFilter = document.getElementById('equipmentFilter').value;
            const targetFilter = document.getElementById('targetFilter').value;

            console.log(' Applying filters:', { searchTerm, bodyPartFilter, equipmentFilter, targetFilter });

            // Apply all filters to the complete exercise list from API
            filteredExercises = allExercises.filter(exercise => {
                // Check if search term matches any exercise property (name, target, equipment, bodyPart)
                const matchesSearch = !searchTerm || 
                    exercise.name.toLowerCase().includes(searchTerm) ||
                    exercise.target.toLowerCase().includes(searchTerm) ||
                    exercise.equipment.toLowerCase().includes(searchTerm) ||
                    exercise.bodyPart.toLowerCase().includes(searchTerm);

                // Check if exercise matches selected filters
                const matchesBodyPart = !bodyPartFilter || exercise.bodyPart === bodyPartFilter;
                const matchesEquipment = !equipmentFilter || exercise.equipment === equipmentFilter;
                const matchesTarget = !targetFilter || exercise.target === targetFilter;

                // Exercise must match ALL criteria to be included in results
                return matchesSearch && matchesBodyPart && matchesEquipment && matchesTarget;
            });

            console.log(' Filtering result:', filteredExercises.length, 'exercises match criteria');

            // Re-apply current sort after filtering
            sortExercises();
            
            // Update the display with filtered results
            displayExercises();
            updateResultsCount();
        }

        /**
         * Sort exercises based on the selected criteria
         * Maintains sort order when filters are applied
         */
        function sortExercises() {
            const sortBy = document.getElementById('sortSelect').value;
            console.log(' Sorting exercises by:', sortBy);

            // Sort the filtered exercises array based on selected criteria
            filteredExercises.sort((a, b) => {
                let valueA, valueB;
                
                // Determine what property to sort by
                switch(sortBy) {
                    case 'name':
                        valueA = a.name.toLowerCase();
                        valueB = b.name.toLowerCase();
                        break;
                    case 'bodyPart':
                        valueA = a.bodyPart.toLowerCase();
                        valueB = b.bodyPart.toLowerCase();
                        break;
                    case 'equipment':
                        valueA = a.equipment.toLowerCase();
                        valueB = b.equipment.toLowerCase();
                        break;
                    case 'target':
                        valueA = a.target.toLowerCase();
                        valueB = b.target.toLowerCase();
                        break;
                    default:
                        valueA = a.name.toLowerCase();
                        valueB = b.name.toLowerCase();
                }

                // Perform alphabetical comparison
                return valueA.localeCompare(valueB);
            });

            // Refresh the display with sorted exercises
            displayExercises();
        }

        /**
         * Display exercises in the grid layout
         * Creates exercise cards dynamically for each exercise from API data
         */
        function displayExercises() {
            const grid = document.getElementById('exerciseGrid');
            
            // Clear existing exercise cards
            grid.innerHTML = '';

            console.log(' Displaying', filteredExercises.length, 'exercises in responsive grid');

            // Create and append exercise cards for each filtered exercise
            filteredExercises.forEach((exercise, index) => {
                const card = createExerciseCard(exercise, index);
                grid.appendChild(card);
            });
        }

        /**
         * Create an individual exercise card element using comprehensive data from ExerciseDB API
         * @param {Object} exercise - Complete exercise object from ExerciseDB API with all fields
         * @param {number} index - Index for staggered animation delay
         * @returns {HTMLElement} - Enhanced exercise card element with all API data
         */
        function createExerciseCard(exercise, index) {
            const card = document.createElement('div');
            // Add classes for styling, hover effects, and fade-in animations
            card.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden card-hover cursor-pointer fade-in border border-gray-200 dark:border-gray-700';
            
            // Add slight delay for staggered animation effect
            card.style.animationDelay = `${index * 0.05}s`;

            // Helper function to get difficulty badge color from API data
            const getDifficultyColor = (difficulty) => {
                switch(difficulty?.toLowerCase()) {
                    case 'beginner': return 'bg-green-500';
                    case 'intermediate': return 'bg-yellow-500';
                    case 'advanced': return 'bg-red-500';
                    default: return 'bg-gray-500';
                }
            };

            // Create the enhanced card HTML content with comprehensive exercise information from API
            card.innerHTML = `
                <!-- Exercise demonstration GIF from ExerciseDB API -->
                <div class="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 h-48">
                    <img 
                        src="${exercise.gifUrl || `https://cdn.jefit.com/assets/img/exercises/gifs/${exercise.id}.gif`}" 
                        alt="${exercise.name} demonstration"
                        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                        onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iNzAiIHI9IjMwIiBmaWxsPSIjZTVlN2ViIi8+PHJlY3QgeD0iMTIwIiB5PSIxMDAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iMTcwIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXhlcmNpc2UgRGVtbzwvdGV4dD48L3N2Zz4='; this.classList.add('opacity-75');"
                    >
                    <!-- Multiple badges with exercise metadata from API -->
                    <div class="absolute top-3 right-3 flex flex-col gap-2">
                        <!-- Body part badge -->
                        <div class="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur">
                            ${capitalizeWords(exercise.bodyPart)}
                        </div>
                        <!-- Difficulty level badge from API -->
                        ${exercise.difficulty ? `
                        <div class="${getDifficultyColor(exercise.difficulty)} text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur">
                            ${capitalizeWords(exercise.difficulty)}
                        </div>
                        ` : ''}
                    </div>
                    <!-- Category badge from API -->
                    ${exercise.category ? `
                    <div class="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur">
                        ${capitalizeWords(exercise.category)}
                    </div>
                    ` : ''}
                </div>
                
                <!-- Enhanced exercise information section with all API data -->
                <div class="p-6">
                    <!-- Exercise name as card title -->
                    <h3 class="font-bold text-xl mb-3 text-gray-900 dark:text-white leading-tight">
                        ${capitalizeWords(exercise.name)}
                    </h3>
                    
                    <!-- Exercise description preview from API -->
                    ${exercise.description ? `
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        ${exercise.description.substring(0, 120)}${exercise.description.length > 120 ? '...' : ''}
                    </p>
                    ` : ''}
                    
                    <!-- Enhanced exercise details grid with all API information -->
                    <div class="space-y-3 text-sm">
                        <!-- Primary target muscle information from API -->
                        <div class="flex items-center justify-between p-3 bg-primary/5 dark:bg-primary/10 rounded-lg">
                            <span class="text-gray-600 dark:text-gray-400 font-medium">Primary Target:</span>
                            <span class="font-semibold bg-primary text-white px-3 py-1 rounded-full text-xs">
                                ${capitalizeWords(exercise.target)}
                            </span>
                        </div>
                        
                        <!-- Secondary muscles from API (if available) -->
                        ${exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 ? `
                        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span class="text-gray-600 dark:text-gray-400 font-medium text-xs block mb-2">Secondary Muscles:</span>
                            <div class="flex flex-wrap gap-1">
                                ${exercise.secondaryMuscles.slice(0, 3).map(muscle => 
                                    `<span class="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">${capitalizeWords(muscle)}</span>`
                                ).join('')}
                                ${exercise.secondaryMuscles.length > 3 ? `<span class="text-xs text-blue-600 dark:text-blue-400">+${exercise.secondaryMuscles.length - 3} more</span>` : ''}
                            </div>
                        </div>
                        ` : ''}
                        
                        <!-- Equipment and body part information from API -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                                <span class="text-gray-600 dark:text-gray-400 font-medium text-xs block">Equipment</span>
                                <span class="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                    ${capitalizeWords(exercise.equipment)}
                                </span>
                            </div>
                            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                                <span class="text-gray-600 dark:text-gray-400 font-medium text-xs block">Body Part</span>
                                <span class="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                    ${capitalizeWords(exercise.bodyPart)}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Instructions preview from API -->
                        ${exercise.instructions && exercise.instructions.length > 0 ? `
                        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <span class="text-gray-600 dark:text-gray-400 font-medium text-xs block mb-2">Quick Steps:</span>
                            <div class="text-xs text-amber-700 dark:text-amber-300">
                                ${exercise.instructions.slice(0, 2).map((instruction, i) => 
                                    `<div class="mb-1">${i + 1}. ${instruction.substring(0, 80)}${instruction.length > 80 ? '...' : ''}</div>`
                                ).join('')}
                                ${exercise.instructions.length > 2 ? `<div class="text-amber-600 dark:text-amber-400 font-medium">+${exercise.instructions.length - 2} more steps...</div>` : ''}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Enhanced action button -->
                    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <button class="w-full btn-primary text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg">
                            <span>📋</span>
                            <span>View Full Instructions & Demo</span>
                        </button>
                    </div>
                </div>
            `;

            // Add click handler to show comprehensive exercise details with all API data
            card.addEventListener('click', () => showExerciseDetails(exercise));

            return card;
        }

        /**
         * Show comprehensive exercise information in a modal using all ExerciseDB API data
         * @param {Object} exercise - Complete exercise object from API with instructions, description, difficulty, etc.
         */
        function showExerciseDetails(exercise) {
            // Create modal overlay
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4';
            
            // Helper function to get difficulty badge color from API data
            const getDifficultyColor = (difficulty) => {
                switch(difficulty?.toLowerCase()) {
                    case 'beginner': return 'bg-green-500 text-white';
                    case 'intermediate': return 'bg-yellow-500 text-white';
                    case 'advanced': return 'bg-red-500 text-white';
                    default: return 'bg-gray-500 text-white';
                }
            };

            // Create comprehensive modal content with all exercise details from ExerciseDB API
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-8">
                        <!-- Enhanced modal header with exercise metadata from API -->
                        <div class="flex justify-between items-start mb-6">
                            <div class="flex-1">
                                <div class="flex items-center gap-4 mb-3">
                                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                                        ${capitalizeWords(exercise.name)}
                                    </h2>
                                    <!-- Difficulty and category badges from API -->
                                    <div class="flex gap-2">
                                        ${exercise.difficulty ? `
                                        <span class="${getDifficultyColor(exercise.difficulty)} px-3 py-1 rounded-full text-sm font-medium">
                                            ${capitalizeWords(exercise.difficulty)}
                                        </span>
                                        ` : ''}
                                        ${exercise.category ? `
                                        <span class="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            ${capitalizeWords(exercise.category)}
                                        </span>
                                        ` : ''}
                                    </div>
                                </div>
                                <p class="text-gray-600 dark:text-gray-400">Complete Exercise Guide from ExerciseDB API</p>
                            </div>
                            <button onclick="this.closest('.fixed').remove(); document.body.style.overflow = 'auto';" 
                                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-4">
                                ×
                            </button>
                        </div>
                        
                        <!-- Exercise description from API (if available) -->
                        ${exercise.description ? `
                        <div class="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                            <h3 class="font-bold text-lg mb-3 text-blue-800 dark:text-blue-300 flex items-center space-x-2">
                                <span>📋</span>
                                <span>Exercise Description</span>
                            </h3>
                            <p class="text-blue-700 dark:text-blue-300 leading-relaxed">
                                ${exercise.description}
                            </p>
                        </div>
                        ` : ''}
                        
                        <!-- Main content grid -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <!-- Left column: Exercise demonstration and basic info -->
                            <div class="space-y-6">
                                <!-- Exercise demonstration GIF from ExerciseDB API -->
                                <div class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden p-4">
                                    <img src="${exercise.gifUrl || `https://cdn.jefit.com/assets/img/exercises/gifs/${exercise.id}.gif`}" 
                                         alt="${exercise.name} demonstration" 
                                         class="w-full h-auto rounded-xl shadow-lg mx-auto"
                                         style="max-height: 400px; object-fit: contain;"
                                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTAwIiByPSI0MCIgZmlsbD0iI2U1ZTdlYiIvPjxyZWN0IHg9IjE2MCIgeT0iMTQwIiB3aWR0aD0iODAiIGhlaWdodD0iNjAiIGZpbGw9IiNlNWU3ZWIiLz48dGV4dCB4PSI1MCUiIHk9IjI0MCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkV4ZXJjaXNlIERlbW9uc3RyYXRpb248L3RleHQ+PC9zdmc+'; this.classList.add('opacity-75');">
                                </div>
                                
                                <!-- Exercise metadata grid using comprehensive API data -->
                                <div class="grid grid-cols-2 gap-4">
                                    <!-- Primary target muscle from API -->
                                    <div class="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4 rounded-xl text-center border border-primary/20">
                                        <div class="text-2xl mb-2">🎯</div>
                                        <div class="font-bold text-gray-900 dark:text-white text-sm">Primary Target</div>
                                        <div class="text-primary font-semibold mt-1">${capitalizeWords(exercise.target)}</div>
                                    </div>
                                    
                                    <!-- Body part from API -->
                                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl text-center border border-green-200 dark:border-green-700">
                                        <div class="text-2xl mb-2">💪</div>
                                        <div class="font-bold text-gray-900 dark:text-white text-sm">Body Part</div>
                                        <div class="text-green-700 dark:text-green-400 font-semibold mt-1">${capitalizeWords(exercise.bodyPart)}</div>
                                    </div>
                                    
                                    <!-- Equipment from API -->
                                    <div class="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl text-center border border-orange-200 dark:border-orange-700">
                                        <div class="text-2xl mb-2">🏋️</div>
                                        <div class="font-bold text-gray-900 dark:text-white text-sm">Equipment</div>
                                        <div class="text-orange-700 dark:text-orange-400 font-semibold mt-1">${capitalizeWords(exercise.equipment)}</div>
                                    </div>
                                    
                                    <!-- Exercise ID from API -->
                                    <div class="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 p-4 rounded-xl text-center border border-gray-200 dark:border-gray-600">
                                        <div class="text-2xl mb-2">🔢</div>
                                        <div class="font-bold text-gray-900 dark:text-white text-sm">Exercise ID</div>
                                        <div class="text-gray-700 dark:text-gray-300 font-semibold mt-1">${exercise.id}</div>
                                    </div>
                                </div>
                                
                                <!-- Secondary muscles from API (if available) -->
                                ${exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 ? `
                                <div class="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                                    <h3 class="font-bold text-lg mb-3 text-purple-800 dark:text-purple-300 flex items-center space-x-2">
                                        <span>🔗</span>
                                        <span>Secondary Muscles Worked</span>
                                    </h3>
                                    <div class="flex flex-wrap gap-2">
                                        ${exercise.secondaryMuscles.map(muscle => 
                                            `<span class="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium">${capitalizeWords(muscle)}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            
                            <!-- Right column: Detailed instructions and information -->
                            <div class="space-y-6">
                                <!-- Step-by-step instructions from API -->
                                ${exercise.instructions && exercise.instructions.length > 0 ? `
                                <div class="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                                    <h3 class="font-bold text-xl mb-4 text-amber-800 dark:text-amber-300 flex items-center space-x-2">
                                        <span>📝</span>
                                        <span>Step-by-Step Instructions</span>
                                    </h3>
                                    <div class="space-y-4">
                                        ${exercise.instructions.map((instruction, index) => `
                                            <div class="flex items-start space-x-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                                                <div class="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                    ${index + 1}
                                                </div>
                                                <p class="text-amber-800 dark:text-amber-200 leading-relaxed">
                                                    ${instruction}
                                                </p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                ` : `
                                <div class="p-6 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 rounded-xl border border-gray-200 dark:border-gray-600">
                                    <h3 class="font-bold text-lg mb-3 text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                        <span>📝</span>
                                        <span>Instructions</span>
                                    </h3>
                                    <p class="text-gray-600 dark:text-gray-400 italic">
                                        Detailed instructions not available for this exercise from the API. Please consult a fitness professional for proper form guidance.
                                    </p>
                                </div>
                                `}
                                
                                <!-- Safety tips and best practices -->
                                <div class="p-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200 dark:border-red-700">
                                    <h3 class="font-bold text-lg mb-4 text-red-800 dark:text-red-300 flex items-center space-x-2">
                                        <span>⚠️</span>
                                        <span>Safety Guidelines & Tips</span>
                                    </h3>
                                    <ul class="space-y-2 text-sm text-red-700 dark:text-red-300">
                                        <li class="flex items-start space-x-2">
                                            <span class="text-red-500 mt-1">•</span>
                                            <span>Always warm up before exercising and cool down afterward</span>
                                        </li>
                                        <li class="flex items-start space-x-2">
                                            <span class="text-red-500 mt-1">•</span>
                                            <span>Focus on proper form over heavy weights or fast repetitions</span>
                                        </li>
                                        <li class="flex items-start space-x-2">
                                            <span class="text-red-500 mt-1">•</span>
                                            <span>Start with lighter resistance and gradually progress</span>
                                        </li>
                                        <li class="flex items-start space-x-2">
                                            <span class="text-red-500 mt-1">•</span>
                                            <span>Breathe consistently throughout the movement</span>
                                        </li>
                                        <li class="flex items-start space-x-2">
                                            <span class="text-red-500 mt-1">•</span>
                                            <span>Stop immediately if you experience pain or discomfort</span>
                                        </li>
                                        <li class="flex items-start space-x-2">
                                            <span class="text-red-500 mt-1">•</span>
                                            <span>Consult a fitness professional for personalized guidance</span>
                                        </li>
                                    </ul>
                                </div>
                                
                                <!-- Additional exercise information -->
                                <div class="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                                    <h3 class="font-bold text-lg mb-3 text-indigo-800 dark:text-indigo-300 flex items-center space-x-2">
                                        <span>💡</span>
                                        <span>Exercise Information</span>
                                    </h3>
                                    <div class="grid grid-cols-1 gap-3 text-sm">
                                        ${exercise.difficulty ? `
                                        <div class="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                                            <span class="text-indigo-700 dark:text-indigo-300 font-medium">Difficulty Level:</span>
                                            <span class="font-semibold text-indigo-800 dark:text-indigo-200">${capitalizeWords(exercise.difficulty)}</span>
                                        </div>
                                        ` : ''}
                                        ${exercise.category ? `
                                        <div class="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                                            <span class="text-indigo-700 dark:text-indigo-300 font-medium">Exercise Category:</span>
                                            <span class="font-semibold text-indigo-800 dark:text-indigo-200">${capitalizeWords(exercise.category)}</span>
                                        </div>
                                        ` : ''}
                                        <div class="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                                            <span class="text-indigo-700 dark:text-indigo-300 font-medium">Data Source:</span>
                                            <span class="font-semibold text-indigo-800 dark:text-indigo-200">ExerciseDB API</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page and prevent background scrolling
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
        }

        /**
         * Update the results counter display
         * Shows how many exercises are currently visible vs total from API
         */
        function updateResultsCount() {
            const count = filteredExercises.length;
            const total = allExercises.length;
            const countElement = document.getElementById('resultsCount');
            
            if (count === total) {
                countElement.textContent = `Showing all ${total} exercises from ExerciseDB`;
            } else {
                countElement.textContent = `Showing ${count} of ${total} exercises from ExerciseDB`;
            }
            
            // Add additional context if no results found
            if (count === 0 && total > 0) {
                countElement.innerHTML = `<span class="text-orange-600">No exercises match your search criteria</span>`;
            }
        }

        /**
         * Update API connection status indicator
         * @param {string} message - Status message to display
         * @param {string} type - Status type (loading, success, error)
         */
        function updateApiStatus(message, type) {
            const statusElement = document.getElementById('apiStatus');
            statusElement.textContent = message;
            
            // Remove existing status classes
            statusElement.classList.remove('bg-green-100', 'text-green-600', 'bg-red-100', 'text-red-600', 'bg-yellow-100', 'text-yellow-600');
            statusElement.classList.remove('dark:bg-green-900', 'dark:text-green-400', 'dark:bg-red-900', 'dark:text-red-400', 'dark:bg-yellow-900', 'dark:text-yellow-400');
            
            // Apply status-specific styling
            switch(type) {
                case 'success':
                    statusElement.classList.add('bg-green-100', 'text-green-600', 'dark:bg-green-900', 'dark:text-green-400');
                    break;
                case 'error':
                    statusElement.classList.add('bg-red-100', 'text-red-600', 'dark:bg-red-900', 'dark:text-red-400');
                    break;
                case 'loading':
                default:
                    statusElement.classList.add('bg-yellow-100', 'text-yellow-600', 'dark:bg-yellow-900', 'dark:text-yellow-400');
                    break;
            }
        }

        /**
         * Show error message and attempt to load sample data as fallback
         * Provides graceful degradation when ExerciseDB API is unavailable
         */
        function showError() {
            // Hide loading indicator and show error message
            document.getElementById('loadingIndicator').classList.add('hidden');
            document.getElementById('errorMessage').classList.remove('hidden');
            document.getElementById('exerciseGrid').classList.add('hidden');
            
            // Attempt to load sample data after a short delay as fallback
            console.log('⚠️ ExerciseDB API failed, will load sample data as fallback');
            setTimeout(() => {
                loadSampleData();
            }, 2000);
        }

        /**
         * Load sample exercise data as fallback when ExerciseDB API is unavailable
         * Provides offline functionality with demonstration exercises
         * This is only used when the real API fails
         */
        function loadSampleData() {
            console.log(' Loading sample exercise data for demonstration (API fallback)');
            
            // Hide error message
            document.getElementById('errorMessage').classList.add('hidden');
            
            // Update status and results counter to indicate sample data
            updateApiStatus('Using Sample Data (API Offline)', 'error');
            const resultsCount = document.getElementById('resultsCount');
            resultsCount.innerHTML = `<span class="text-orange-600 font-medium">⚠️ Showing sample data - ExerciseDB API connection failed</span>`;
            
            // Sample exercises with placeholder images for demonstration
            // These represent the structure of real ExerciseDB API data
            const sampleExercises = [
                {
                    id: "sample_0001",
                    name: "3/4 sit-up",
                    target: "abs",
                    bodyPart: "waist",
                    equipment: "body weight",
                    gifUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iNzAiIHI9IjI1IiBmaWxsPSIjZDFkNWRiIi8+PHJlY3QgeD0iMTI1IiB5PSI5NSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZDFkNWRiIi8+PHJlY3QgeD0iMTM1IiB5PSIxMjUiIHdpZHRoPSIzMCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2QxZDVkYiIvPjx0ZXh0IHg9IjUwJSIgeT0iMTgwIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2FtcGxlOiBTaXQtdXA8L3RleHQ+PC9zdmc+"
                },
                {
                    id: "sample_0002", 
                    name: "45° side bend",
                    target: "abs",
                    bodyPart: "waist",
                    equipment: "body weight",
                    gifUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2IpIi8+PGNpcmNsZSBjeD0iMTQwIiBjeT0iNjAiIHI9IjI1IiBmaWxsPSIjZDFkNWRiIi8+PHJlY3QgeD0iMTIwIiB5PSI4NSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZDFkNWRiIiB0cmFuc2Zvcm09InJvdGF0ZSgxNSAxNDAgMTA1KSIvPjxyZWN0IHg9IjEzMCIgeT0iMTI1IiB3aWR0aD0iMjAiIGhlaWdodD0iNDAiIGZpbGw9IiNkMWQ1ZGIiLz48dGV4dCB4PSI1MCUiIHk9IjE4MCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlNhbXBsZTogU2lkZSBCZW5kPC90ZXh0Pjwvc3ZnPg=="
                },
                {
                    id: "sample_0003",
                    name: "air bike",
                    target: "abs",
                    bodyPart: "waist", 
                    equipment: "body weight",
                    gifUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImMiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2MpIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iNTAiIHI9IjIwIiBmaWxsPSIjZDFkNWRiIi8+PHJlY3QgeD0iMTMwIiB5PSI3MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZDFkNWRiIi8+PGVsbGlwc2UgY3g9IjEyMCIgY3k9IjEyMCIgcng9IjE1IiByeT0iMjUiIGZpbGw9IiNkMWQ1ZGIiLz48ZWxsaXBzZSBjeD0iMTgwIiBjeT0iMTEwIiByeD0iMTUiIHJ5PSIyNSIgZmlsbD0iI2QxZDVkYiIvPjx0ZXh0IHg9IjUwJSIgeT0iMTgwIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2FtcGxlOiBBaXIgQmlrZTwvdGV4dD48L3N2Zz4="
                },
                {
                    id: "sample_0004",
                    name: "barbell bench press",
                    target: "pectorals",
                    bodyPart: "chest",
                    equipment: "barbell",
                    gifUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2QpIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZDFkNWRiIi8+PHJlY3QgeD0iMTMwIiB5PSI2MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZDFkNWRiIi8+PHJlY3QgeD0iODAiIHk9Ijc1IiB3aWR0aD0iMTQwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjOTljYTNhZiIgcng9IjUiLz48Y2lyY2xlIGN4PSI2NSIgY3k9IjgwIiByPSIxNSIgZmlsbD0iIzZiNzI4MCIvPjxjaXJjbGUgY3g9IjIzNSIgY3k9IjgwIiByPSIxNSIgZmlsbD0iIzZiNzI4MCIvPjxyZWN0IHg9IjEzNSIgeT0iMTAwIiB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIGZpbGw9IiNkMWQ1ZGIiLz48dGV4dCB4PSI1MCUiIHk9IjE4MCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlNhbXBsZTogQmVuY2ggUHJlc3M8L3RleHQ+PC9zdmc+"
                },
                {
                    id: "sample_0005",
                    name: "dumbbell bicep curl",
                    target: "biceps",
                    bodyPart: "upper arms",
                    equipment: "dumbbell",
                    gifUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImUiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2UpIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZDFkNWRiIi8+PHJlY3QgeD0iMTMwIiB5PSI2MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZDFkNWRiIi8+PGVsbGlwc2UgY3g9IjEyMCIgY3k9IjEwMCIgcng9IjEwIiByeT0iMzAiIGZpbGw9IiNkMWQ1ZGIiLz48ZWxsaXBzZSBjeD0iMTgwIiBjeT0iMTAwIiByeD0iMTAiIHJ5PSIzMCIgZmlsbD0iI2QxZDVkYiIvPjxyZWN0IHg9IjEwNSIgeT0iODUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzZiNzI4MCIgcng9IjUiLz48cmVjdCB4PSIxNjUiIHk9Ijg1IiB3aWR0aD0iMzAiIGhlaWdodD0iMTAiIGZpbGw9IiM2Yjc2ODAiIHJ4PSI1Ii8+PHRleHQgeD0iNTAlIiB5PSIxODAiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TYW1wbGU6IEJpY2VwIEN1cmw8L3RleHQ+PC9zdmc+"
                }
            ];

            // Process sample data using the same flow as real API data
            processExerciseData(sampleExercises);
            
            console.log(' Sample data loaded successfully as ExerciseDB API fallback');
        }

        /**
         * Initialize the application when page loads
         * Sets up theme, event listeners, and starts data loading from ExerciseDB API
         */
        function initializeApp() {
            console.log(' Initializing the application');
            
            // Set up dark mode functionality
            initializeDarkMode();
            
            // Listen for system theme changes if user hasn't set preference
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                if (!localStorage.getItem('theme')) {
                    const darkModeIcon = document.getElementById('darkModeIcon');
                    if (event.matches) {
                        document.documentElement.classList.add('dark');
                        darkModeIcon.textContent = '☀️';
                    } else {
                        document.documentElement.classList.remove('dark');
                        darkModeIcon.textContent = '🌙';
                    }
                }
            });
            
            // Start loading exercises from the API
            console.log('🔌Loading exercises from API');
            loadExercises();
        }

        // Start the application when DOM is fully loaded
        document.addEventListener('DOMContentLoaded', initializeApp);
        
        console.log(' FitExplorer script loaded and ready to connect to ExerciseDB API');

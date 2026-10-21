/* --------------------- CONSTANTS --------------------- */

const DATA_URL = 'assets/exercises.json';

// the full anatomy picture, zoomed out
const FULL_VIEW = { x: 0, y: 0, width: 600, height: 600 };

// each group area's coordinates and sizes
const GROUP_VIEWS = {
    chest: { x: 75, y: 75, width: 185, height: 135 },
    back: { x: 315, y: 50, width: 235, height: 230 },
    arms: { x: 210, y: 145, width: 180, height: 165 },
    shoulders: { x: 205, y: 70, width: 225, height: 140 },
    legs: { x: 85, y: 245, width: 430, height: 355 }
};

// animation durations
const ANIMATION = {
    zoom: 900,
    fade: 250,
    slide: 450,
    scroll: 600,
    easing: 'easeInOutCubic'
};

const DIMMED_OPACITY = 0.2; // how visible the rest of the body stays when spotlighting
const SCROLL_MARGIN = 16; // space above selected element in px

// text for step 1 and 2
const PAGE_TEXT = {
    groupsTitle: 'Choose a Muscle Group',
    groupsIntro: 'Pick the area of the body you want to train. Next, you will narrow it down to one specific muscle.',
    groupsPrompt: 'Hover over a region of the body to see its name, then click to select it. On a touch screen, tap a colored region. Using a keyboard? Press Tab to move between regions and Enter to select.',
    musclesPrompt: 'Hover over a muscle and click it to see its exercises. Using a keyboard? Press Tab to move between muscles and Enter to select.'
};

/* --------------------- HELPERS --------------------- */

// jQuery has limited easing options, so this allows for a smoother curve
// progress is 0 to 1
function addCustomEasing() {
    $.easing.easeInOutCubic = function(progress) {
        if (progress < 0.5) {
            return 4 * progress * progress * progress;
        }
        return 1 - Math.pow(-2 * progress + 2, 3) / 2;
    };
}

// if reduce motion is on, animations will be instant
function respectReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        $.fx.off = true;
    }
}

/* --------------------- DATA --------------------- */

// downloads and parses exercises JSON
async function loadExerciseData() {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
        throw new Error('Request for ' + DATA_URL + ' failed with status ' + response.status);
    }
    return response.json();
}

// returns the group whose id matches groupId or undefined
function findGroup(data, groupId) {
    return data.groups.find(group => group.id === groupId);
}

// returns muscle inside group whose id matches muscleId or undefined
function findMuscle(group, muscleId) {
    return group.muscles.find(muscle => muscle.id === muscleId);
}

/* --------------------- PAGE TEXT --------------------- */

// returns 1 exercise or 3 exercises
function pluralize(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
}

// puts a message in role="status" for screen readers
function announce(message) {
    $('#status').text(message);
}

// update page heading, intro, and prompt
function setPageText(title, intro, prompt) {
    $('#page-title').text(title);
    $('#page-intro').text(intro);
    $('#map-prompt').text(prompt);
}

// shows a region's name under the map
function showRegionName(regionElement) {
    $('#region-name').text($(regionElement).attr('aria-label'));
}

// empties the name label under the map
function clearRegionName() {
    $('#region-name').text('');
}

/* --------------------- EXERCISE CARDS --------------------- */

// returns a <ul> of equipment tags
function createTagList(equipment) {
    const $list = $('<ul>', { class: 'tag-list' });
    equipment.forEach(item => $('<li>', { text: item }).appendTo($list));
    return $list;
}

// returns a <ol> of instruction steps
function createStepList(steps) {
    const $list = $('<ol>', { class: 'steps' });
    steps.forEach(step => $('<li>', { text: step }).appendTo($list));
    return $list;
}

// returns looping demo <img>
// tall GIF has a class so it doesn't stretch
function createExerciseGif(exercise) {
    const $gif = $('<img>', {
        class: 'exercise-gif',
        src: exercise.gif,
        alt: 'Looping animation showing how to do ' + exercise.name.toLowerCase() + '.',
        loading: 'lazy'
    });

    if (exercise.tallGif) {
        $gif.addClass('gif-tall');
    }

    return $gif;
}

// returns one <article> card for an exercise
function createExerciseCard(exercise, index) {
    const headingId = 'exercise-' + index;
    const $body = $('<div>', { class: 'exercise-body' }).append(
        $('<h3>', { id: headingId, text: exercise.name }),
        $('<h4>', { text: 'Equipment Needed' }),
        createTagList(exercise.equipment),
        createExerciseGif(exercise),
        $('<h4>', { text: 'How To Do It' }),
        createStepList(exercise.steps)
    );
    return $('<article>', { class: 'exercise', 'aria-labelledby': headingId }).append($body);
}

// fills the panel's heading, description, and cards for one muscle object
function fillExercisePanel(muscle) {
    $('#muscle-title').text(muscle.name);
    $('#muscle-description').text(muscle.description);
    $('#exercise-list').empty().append(muscle.exercises.map(createExerciseCard));
}

/* --------------------- MAP ANIMATION --------------------- */

// copies the camera's numbers onto the svg
function drawCamera(mapElement, camera) {
    mapElement.setAttribute('viewBox', camera.x + ' ' + camera.y + ' ' + camera.width + ' ' + camera.height);
    mapElement.style.aspectRatio = camera.width + ' / ' + camera.height;
}

// glides the camera to targetView by redrawing the SVG every frame
function moveCamera(mapElement, camera, targetView, onDone) {
    $(camera).stop().animate(targetView, {
        duration: ANIMATION.zoom,
        easing: ANIMATION.easing,
        progress: function() {
            drawCamera(mapElement, camera);
        },
        complete: function() {
            drawCamera(mapElement, camera);
            onDone();
        }
    });
}

// fades normal image to a dark silhouette if true or back to full brightness if false
function dimBaseImage(shouldDim) {
    const targetOpacity = shouldDim ? DIMMED_OPACITY : 1;
    $('#map-base').stop().animate({ opacity: targetOpacity }, ANIMATION.zoom, ANIMATION.easing);
}

// copies one group's muscle polygons into clipPath, so the bright copy of image shows through
function setSpotlight($muscleLayer) {
    $('#spotlight-shape').empty().append($muscleLayer.find('polygon').clone());
}

// empties clipPath so bright copy of image disappears
function clearSpotlight() {
    $('#spotlight-shape').empty();
}

// reveals a layer of clickable regions with a short fade
function showLayer($layer) {
    $layer.removeClass('is-hidden').css('opacity', 0).animate({ opacity: 1 }, ANIMATION.fade);
}

// hides a layer at once
function hideLayer($layer) {
    $layer.stop().addClass('is-hidden');
}

// smoothly scrolls the page so element sits near the top of window
function scrollToElement($element) {
    $('html, body').stop().animate({ scrollTop: $element.offset().top - SCROLL_MARGIN }, ANIMATION.scroll, ANIMATION.easing);
}

/* --------------------- EXERCISE PANEL --------------------- */

// un-highlights every muscle and marks them all as not pressed
function clearSelectedMuscle() {
    $('.muscle-region').removeClass('is-selected').attr('aria-pressed', 'false');
}

// highlights the chosen muscle on the map and tells screen reader it is pressed
function markSelectedMuscle($region) {
    clearSelectedMuscle();
    $region.addClass('is-selected').attr('aria-pressed', 'true');
}

// scrolls panel into view and moves keyboard focus to its heading
function focusExercisePanel() {
    scrollToElement($('#exercise-panel'));
    document.getElementById('muscle-title').focus({ preventScroll: true });
}

// shows a muscle's exercises
// the first time, panel slides open. after that, old cards fade out and new ones fade in
function showExercisePanel(muscle) {
    const $panel = $('#exercise-panel');
    if ($panel.is(':visible')) {
        $panel.stop(true, true).fadeTo(ANIMATION.fade, 0, function() {
            fillExercisePanel(muscle);
            $panel.fadeTo(ANIMATION.fade, 1);
            focusExercisePanel();
        });
    } else {
        fillExercisePanel(muscle);
        $panel.stop(true, true).css('opacity', 1).slideDown(ANIMATION.slide, focusExercisePanel);
    }
}

// slides the exercise panel closed
function hideExercisePanel() {
    $('#exercise-panel').stop(true, true).slideUp(ANIMATION.slide);
}

/* --------------------- THE TWO-STEP --------------------- */

// step 1 -> 2: zooms to clicked group, spotlights it, and swaps in its muscles
function selectGroup(app, groupId) {
    const group = findGroup(app.data, groupId);
    const $muscleLayer = $('.muscle-layer[data-group="' + groupId + '"]');

    $(app.mapElement).attr('data-active-group', groupId);
    hideLayer($('#group-layer'));
    clearRegionName();
    setPageText(group.name, group.description, PAGE_TEXT.musclesPrompt);
    $('#back-button').fadeIn(ANIMATION.fade);

    setSpotlight($muscleLayer);
    dimBaseImage(true);
    moveCamera(app.mapElement, app.camera, GROUP_VIEWS[groupId], function() {
        showLayer($muscleLayer);
        $muscleLayer.find('.region').first().trigger('focus');
        announce(group.name + ' selected. Choose one of ' + group.muscles.length + ' muscles.');
    });
}

// step 2 -> 3: show exercises for the clicked muscle region
function selectMuscle(app, $region) {
    const group = findGroup(app.data, $(app.mapElement).attr('data-active-group'));
    const muscle = findMuscle(group, $region.data('muscle'));

    markSelectedMuscle($region);
    showExercisePanel(muscle);
    announce('Showing ' + pluralize(muscle.exercises.length, 'exercise') + ' for ' + muscle.name + '.');
}

// back to step 1: close exercises, zoom out, restore 5 groups
function returnToGroups(app) {
    const groupId = $(app.mapElement).attr('data-active-group');
    const $muscleLayer = $('.muscle-layer[data-group="' + groupId + '"]');

    $(app.mapElement).removeAttr('data-active-group');
    hideExercisePanel();
    clearSelectedMuscle();
    hideLayer($muscleLayer);
    $('#back-button').fadeOut(ANIMATION.fade);
    setPageText(PAGE_TEXT.groupsTitle, PAGE_TEXT.groupsIntro, PAGE_TEXT.groupsPrompt);
    scrollToElement($('#map-prompt'));

    dimBaseImage(false);
    moveCamera(app.mapElement, app.camera, FULL_VIEW, function() {
        clearSpotlight();
        showLayer($('#group-layer'));
        $('.group-region[data-group="' + groupId + '"]').trigger('focus');
        announce('Back to all muscle groups.');
    });
}

/* --------------------- EVENT HANDLERS --------------------- */

// shows a region's name while it's hovered, focused, or long-pressed on touch screen
function setUpRegionLabels() {
    $('#body-map')
        .on('mouseenter focus', '.region', function() {
            showRegionName(this);
        })
        .on('mouseleave blur', '.region', clearRegionName)
        .on('contextmenu', '.region', function(event) {
            event.preventDefault();
            showRegionName(this);
        });
}

// make Enter and Space click so role="button" acts like a real button
function setUpKeyboardClicks() {
    $('#body-map').on('keydown', '.region', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            $(this).trigger('click');
        }
    });
}

// connects the map and the back button
function setUpClicks(app) {
    $('#body-map')
        .on('click', '.group-region', function() {
            selectGroup(app, $(this).data('group'));
        })
        .on('click', '.muscle-region', function() {
            selectMuscle(app, $(this));
        });    
    $('#back-button').on('click', function() {
        returnToGroups(app);
    });
}

/* --------------------- START-UP --------------------- */

// runs once the JSON is ready, bundles what every step needs into one object
function startApp(data) {
    const app = {
        data: data,
        camera: { ...FULL_VIEW },
        mapElement: document.getElementById('body-map')
    };
    setUpClicks(app);
    $('#body-map').removeClass('is-loading');
    announce('');
}

// tells the user the data failed to load and offers retry
function showLoadError() {
    announce('Sorry, the exercises could not be loaded. Check your connection and try again!');
    $('#retry-button').show();
}

// fetches the data, starts the app, and shows error
async function loadAndStart() {
    $('#retry-button').hide();
    announce('Loading exercises...');
    let data;
    try {
        data = await loadExerciseData();
    } catch {
        showLoadError();
        return;
    }
    startApp(data);
}

// everything that happens once when the page opens
function setUpPage() {
    addCustomEasing();
    respectReducedMotion();
    setUpRegionLabels();
    setUpKeyboardClicks();
    $('#retry-button').on('click', loadAndStart);
    loadAndStart();
}

$(setUpPage);
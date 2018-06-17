// closure to ensure no conflict

(function() {
    // variables: user info
    var user_id = '1111';
    var user_fullname = 'Tianyi Sun';
    var lng = -122.08;
    var lat = 37.38;

    /* step3: main function(entrance) */
    init();

    /* step4: define init function */
    function init() {
        // add an event to one tag
        // <operation> <do what>
        $('nearby-btn').addEventListener('click', loadNearbyItems);
        $('fav-btn').addEventListener('click', loadFavoriteItems);
        $('recommend-btn').addEventListener('click', loadRecommendedItems);

        var welcomeMsg = $('welcome-msg');
        // innerHTML: update the value in html
        welcomeMsg.innerHTML = 'Welcome, ' + user_fullname;

        initGeoLocation();
    }

    /* step5: create $ function */
    /**
     * A helper function that creates a DOM element <tag options...>
     */
    function $(tag, options) {
        // create a target tag, if the options such as tag attributes are null
    	// just do search to find the target tag
    	if (!options) {
            return document.getElementById(tag);
        }
    	
    	// otherwise create a new tag with the following attributes
        var element = document.createElement(tag);

        for (var option in options) {
            if (options.hasOwnProperty(option)) {
                element[option] = options[option];
            }
        }
        return element;
    }

    /* step6: create AJAX helper function */
    /**
     * @param method - GET|POST|PUT|DELETE
     * @param url - API end point
     * @param callback - This the successful callback // the target function
     * to run // caller of ajax() tell me which function should run in ajax()
     * @param errorHandler - This is the failed callback
     */
    function ajax(method, url, data, callback, errorHandler) {
        var xhr = new XMLHttpRequest();

        xhr.open(method, url, true);

        // define onload function to check response (send successfully)
        // xhr is ok, can send to server
        xhr.onload = function() {
            if (xhr.status === 200) {
                callback(xhr.responseText);
            } else if (xhr.status === 403) {
                onSessionInvalid();
            } else {
                errorHandler();
            }
        };

        // define onerror function to check request (send failed)
        // request fail due to an error
        xhr.onerror = function() {
            console.error("The request couldn't be complete.");
            errorHandler();
        };

        if (data === null) {
            xhr.send();
        } else {
            xhr.setRequestHeader("Content-Type",
                "application/json;charset=utf-8");
            xhr.send(data);
        }
        // based on the return from server, will call onload or onerror
    }

    /** step 7: initGeoLocation function **/
    function initGeoLocation() {
        // browser attribute
        if (navigator.geolocation) {
            // call back method
            // so showLoadingMessage will show at first
            navigator.geolocation.getCurrentPosition(onPositionUpdated,
                onLoadPositionFailed, {
                    maximumAge: 60000
                });
            showLoadingMessage('Retrieving your location...');
        } else {
            onLoadPositionFailed();
        }
    }

    /** step 8: onPositionUpdated function **/
    function onPositionUpdated(position) {
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        console.log("Got location from navigator");
        loadNearbyItems();
    }
    
    /** step 9: onPositionUpdated function **/
    function onLoadPositionFailed() {
        console.warn('navigator.geolocation is not available');

        getLocationFromIP();
    }

    /** step 10: getLocationFromIP function **/
    function getLocationFromIP() {
        // Get location from http://ipinfo.io/json
        var url = 'http://ipinfo.io/json'
        var req = null;
        ajax('GET', url, req, function(res) {
            var result = JSON.parse(res);
            if ('loc' in result) {
                var loc = result.loc.split(',');
                lat = loc[0];
                lng = loc[1];
            } else {
                console.warn('Getting location by IP failed.');
            }
            console.log("Got location from IP");
            loadNearbyItems();
        });
    }

    /** step 11: loadNearbyItems function **/
    /**
     * API #1 Load the nearby items API end point: [GET]
     * /Dashi/search?user_id=1111&lat=37.38&lon=-122.08
     */


    function loadNearbyItems() {
        console.log('loadNearbyItems');
        activeBtn('nearby-btn');

        // request param
        var url = './search';
        var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng;
        // to json
        var req = JSON.stringify({});

        // display loading message
        showLoadingMessage('Loading nearby items...');

        // AJAX call
        ajax('GET', url + '?' + params, req,
            function(res) {
                var items = JSON.parse(res);
                if (!items || items.length === 0) {
                    showWarningMessage('No nearby item.');
                } else {
                    listItems(items);
                }
            },
            function() {
                showErrorMessage('Cannot load nearby items.');
            });
    }
    
    
    /**
     * API #2 Load favorite (or visited) items API end point: [GET]
     * /Dashi/history?user_id=1111
     */
    function loadFavoriteItems() {
    	activeBtn('fav-btn');
    	
    	// The request param
    	var url = './history';
    	var params = 'user_id=' + user_id;
        var req = JSON.stringify({});

        // display loading message
        showLoadingMessage('Loading favorite items...');
        
     // make AJAX call
        ajax('GET', url + '?' + params, req, function(res) {
            var items = JSON.parse(res);
            if (!items || items.length === 0) {
                showWarningMessage('No favorite item.');
            } else {
                listItems(items);
            }
        }, function() {
            showErrorMessage('Cannot load favorite items.');
        });
    }
    
    
    /**
     * API #3 Load recommended items API end point: [GET]
     * /Dashi/recommendation?user_id=1111
     */
    function loadRecommendedItems() {
        activeBtn('recommend-btn');

        // The request parameters
        var url = './recommendation';
        var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng;

        var req = JSON.stringify({});

        // display loading message
        showLoadingMessage('Loading recommended items...');

        // make AJAX call
        ajax(
            'GET',
            url + '?' + params,
            req,
            // successful callback
            function(res) {
                var items = JSON.parse(res);
                if (!items || items.length === 0) {
                    showWarningMessage('No recommended item. Make sure you have favorites.');
                } else {
                    listItems(items);
                }
            },
            // failed callback
            function() {
                showErrorMessage('Cannot load recommended items.');
            });
    }
    
    
    /**
     * API #4 Toggle favorite (or visited) items
     * 
     * @param item_id -
     *            The item business id
     * 
     * API end point: [POST]/[DELETE] /Dashi/history request json data: {
     * user_id: 1111, visited: [a_list_of_business_ids] }
     */
    function changeFavoriteItem(item_id) {
        // Check whether this item has been visited or not
        var li = $('item-' + item_id);
        var favIcon = $('fav-icon-' + item_id);
        var favorite = li.dataset.favorite !== 'true';

        // The request parameters
        var url = './history';
        // JS to JSON string
        var req = JSON.stringify({
            user_id: user_id,
            favorite: [item_id]
        });
        var method = favorite ? 'POST' : 'DELETE';

        ajax(method, url, req,
            // successful callback
            function(res) {
                var result = JSON.parse(res);
                if (result.result === 'SUCCESS') {
                    li.dataset.favorite = favorite;
                    favIcon.className = favorite ? 'fa fa-heart' : 'fa fa-heart-o';
                }
            });
    }

    /** step 12: activeBtn function **/

    /**
     * A helper function that makes a navigation button active
     *
     * @param btnId - The id of the navigation button
     */
    function activeBtn(btnId) {
        var btns = document.getElementsByClassName('main-nav-btn');

        // deactivate all navigation buttons
        for (var i = 0; i < btns.length; i++) {
            // replace active to ''
            btns[i].className = btns[i].className.replace(/\bactive\b/, '');
        }

        // active the one that has id = btnId
        var btn = $(btnId);
        btn.className += ' active';
    }

    /** step 13: showLoadingMessage function **/
    function showLoadingMessage(msg) {
    	var itemList = $('item-list');
    	itemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i> '
			+ msg + '</p>';
    }
    
    /** step 14: showWarningMessage function **/
    function showWarningMessage(msg) {
        var itemList = $('item-list');
        itemList.innerHTML = '<p class="notice">' +
            '<i class="fa fa-exclamation-triangle"></i> '
            + msg + '</p>';
    }

    /** step15: showErrorMessage function **/
    function showErrorMessage(msg) {
        var itemList = $('item-list');
        itemList.innerHTML = '<p class="notice">' +
            '<i class="fa fa-exclamation-circle"></i> '
            + msg + '</p>';
    }

    /** step16: listItems function **/
	/**
	 * @param items - An array of item JSON objects
	 */

    function listItems(items) {
    	// clear the current results
    	var itemList = $('item-list');
    	itemList.innerHTML = '';
    	
    	for (var i = 0; i < items.length; i++) {
    		addItem(itemList, items[i]);
    	}
    }

	/** step17: addItem function **/
	/**
	 * Add item to the list
	 * @param itemList - The <ul id="item-list"> tag
	 * @param item - The item data (JSON object)
	 */
    function addItem(itemList, item) {
    	var item_id = item.item_id;
    	
    	// create the <li> tag and specify the id and class attributes
    	var li = $('li', {
    		id : 'item-' + item_id,
    		className : 'item'
    	});
    	
    	// set the data structure
    	li.dataset.item_id = item_id;
    	li.dataset.favorite = item.favorite;
    	
    	// item image
    	if (item.image_url) {
    		// make this <img></img> tag a child of this <li></li>
    		li.appendChild($('img', {
    			src : item.image_url
    		}));
    	} else {
    		li.appendChild($('img', {
    			src : 'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png'
    		}))
    	}
    	
    	// section
    	var section = $('div', {});
    	
    	// title
    	var title = $('a', {
    		href : item.url,
    		target : '_blank',
    		className : 'item-name'
    	});
    	// write something in this <a></a> tag
    	title.innerHTML = item.name;
    	section.appendChild(title);
    	
    	// category
		var category = $('p', {
			className : 'item-category'
		});
		category.innerHTML = 'Category: ' + item.categories.join(', ');
		section.appendChild(category);

		var stars = $('div', {
			className : 'stars'
		});
		
		for (var i = 0; i < item.rating; i++) {
			var star = $('i', {
				className : 'fa fa-star'
			});
			stars.appendChild(star);
		}
		
		if (('' + item.rating).match(/\.5$/)) {
			stars.appendChild($('i', {
				className : 'fa fa-star-half-o'
			}));
		}

		section.appendChild(stars);

		li.appendChild(section);

		// address
		var address = $('p', {
			className : 'item-address'
		});

		address.innerHTML = item.address.replace(/,/g, '<br/>').replace(/\"/g, '');
		li.appendChild(address);

		// favorite link
		var favLink = $('p', {
			className : 'fav-link'
		});

		favLink.onclick = function() {
			changeFavoriteItem(item_id);
		};

		favLink.appendChild($('i', {
			id : 'fav-icon-' + item_id,
			className : item.favorite ? 'fa fa-heart' : 'fa fa-heart-o'
		}));

		li.appendChild(favLink);

		itemList.appendChild(li);
    }
    
    function hideElement(element) {
    	element.style.display = 'none';
    }
    
    function showElement(element, style) {
    	var displayStyle = style ? style : 'block';
    	element.style.display = displayStyle;
    }
    
}) ()

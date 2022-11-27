define(["jquery", "./utils", "./settings"], function ($, util, settings) {

    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    function hapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    var keyToCode = {
      "Escape": 1,
      "`": 41,
      "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "7": 8, "9": 10, "0": 11, "-": 12, "=": 13, "Backspace": 14,
      "Tab": 15, "q": 16, "w": 17, "e": 18, "r": 19, "t": 20, "y": 21, "u": 22, "i": 23, "o": 24, "p": 25, "[": 26, "]": 27, "\\": 43,
      "a": 30, "s": 31, "d": 32, "f": 33, "g": 34, "h": 35, "j": 36, "k": 37, "l": 38, ";": 39, "'": 40, "Enter": 28,
      "Shift": 42, "z": 44, "x": 45, "c": 46, "v": 47, "b": 48, "n": 49, "m": 50, ",": 51, ".": 52, "/": 53,
      "Control": 29,
      " ": 57,  // Space.
      "ArrowUp": 103, "ArrowDown": 108, "ArrowLeft": 105, "ArrowRight": 106,
    };

    function getKeyCodeOfKeyPress(event) {
        var key = event.key
        if (key in keyToCode) {
          return keyToCode[key];
        } else {
          return -1;
        }
    }

    var clickedKeys = [];
    var activeModKeys = {};
    function bindClickAndTouchEvents(cb, settingsCb) {
        $("svg#keyboard > g > g#settings").on("mousedown touchstart", function () {
            $(this).attr('class', 'active');
            hapticFeedback();
            settingsCb();
            $('#settings-modal').removeClass('closed');
        }).on("mouseleave mouseup touchend", function (event) {
            $(this).removeAttr('class');
        });

        $(document).on("contextmenu",function(){
            return false;
        });

        $(document).on('keydown', function(event) {
            console.info("Key down", event.keyCode, event.key);
            var keyCode = getKeyCodeOfKeyPress(event);
            if (keyCode >= 0 && $.inArray(keyCode, clickedKeys) === -1) {
                clickedKeys.push(keyCode);
                console.info("Pressed", keyCode);
                if (cb != null) cb({type: 0x01, code: keyCode, value: 1, hardware: false});
            }
        });

        $(document).on('keyup', function(event) {
            console.info("Key up", event.keyCode, event.key);
            var keyCode = getKeyCodeOfKeyPress(event);
            var idx = $.inArray(keyCode, clickedKeys);
            if (keyCode >= 0 && idx >= 0) {
                clickedKeys.splice(idx, 1);
                console.info("Released press", keyCode);
                if (cb != null) cb({type: 0x01, code: keyCode, value: 0, hardware: false});
            }
        });

        // mousedown mouseup click touchstart touchend
        $("svg#keyboard > g > g:not(#settings)").on("mousedown mouseup click touchstart touchend", function (event) {
            if (event.cancelable) {
                event.preventDefault();
            }
        }).on("touchmove", function (event) {
            if ($(this).data("left")) {
                return;
            }
            if (event.target !== document.elementFromPoint(
                    event.originalEvent.targetTouches[0].pageX,
                    event.originalEvent.targetTouches[0].pageY)) {
                $(this).trigger("mouseleave")
                  .data("left", "true");

            }
        }).on("touchend", function (event) {
            $(this).data("left", null);
        }).on("mousedown touchstart", function (event) {
            hapticFeedback();

            $(this).attr('class', 'active');
            var key = util.parseKeyId($(this).attr('id'));
            var keyIsModKey = key[0]; var keyCode = key[1];

            if ($.inArray(keyCode, clickedKeys) === -1) {
                clickedKeys.push(keyCode);
                if (keyIsModKey && settings.stickyModKeys && !(keyCode in activeModKeys)) {
                    activeModKeys[keyCode] = [0, $(this)];
                    console.info("Activated mod key", keyCode);
                    if (cb != null) cb({type: 0x01, code: keyCode, value: 1, hardware: false});
                } else {
                    console.info("Clicked", keyCode);
                    if (cb != null) cb({type: 0x01, code: keyCode, value: 1, hardware: false});
                }
            }
        }).on("mouseleave mouseup touchend", function (event) {
            var key = util.parseKeyId($(this).attr('id'));
            var keyIsModKey = key[0]; var keyCode = key[1];
            var idx = $.inArray(keyCode, clickedKeys);
            if (idx >= 0) {
                clickedKeys.splice(idx, 1);
                if (keyIsModKey && settings.stickyModKeys && keyCode in activeModKeys) {
                    if (activeModKeys[keyCode][0] === 0) {
                        // first key release
                        activeModKeys[keyCode][0] = 1;
                        return;
                    }
                    delete activeModKeys[keyCode];
                    $(this).removeAttr('class');
                    if (cb != null) cb({type: 0x01, code: keyCode, value: 0, hardware: false});
                } else {
                    console.info("Released click", keyCode);
                    $(this).removeAttr('class');
                    if (cb != null) cb({type: 0x01, code: keyCode, value: 0, hardware: false});
                    for (key in activeModKeys) {
                        var code = parseInt(key);
                        activeModKeys[key][1].removeAttr('class');
                        delete activeModKeys[key];
                        console.info("Deactivated mod key", code);
                        if (cb != null) cb({type: 0x01, code: code, value: 0, hardware: false});
                    }
                }
            }
        });
    }

    return {
        listen: function (cb, settingsCb) {
            bindClickAndTouchEvents(cb, settingsCb);
        }
    }
});

/*
 * jQuery Wire Widget Helper
 * 2016 Pierre M
 * License: MIT
 */

"use strict";

L.Oscars = L.Oscars || {};
L.Oscars.Dashboard = L.Oscars.Dashboard || {};

L.Oscars.Dashboard.Wire = (function($) {
    "use strict";

    /*
     * Default Values
     */
    var _inited = false;
    var opts;
    var defaults = {
        debug: false,
        voice: false,
        wire_id: "gip-gip-wire",
        wire_container: "ul",
        map_id: "gip-gip-map",
        websocket: null, // 'ws://localhost:8051', 'ws://hostname.local:8051'
        markRead: null, // 'gipadmin/wire/read'
        // General presentation
        color: 'default',
        icon: 'fa-info',
        size: 'medium',
        speed: 500,
        // More
        numWords: 50,
        dateReminder: 3, // minutes
        ellipsestext: '<i class="fa fa-ellipsis-h"></i>',
        moretext: '<i class="fa fa-angle-double-right"></i>',
        lesstext: '<i class="fa fa-angle-double-left"></i>',
        ignoreTags: ['default', 'unknown'],
        filterNewMessage: false,
        priority_map: [
            '1',
            '2',
            '3'
        ]
    };
    var lastDateReminder = null;

    const bootstrapColors = [
        'default',
        'info',
        'success',
        'primary',
        'warning',
        'danger',
        'accent'
    ];
    const bootstrapColorsVarient = [
        'normal',
        'bright',
        'light',
        'dark'
    ];
    /*
     * Only gets called when we're using $('$el').dashboard format
     */
    var Wire = function() {

    }

    Wire.prototype.defaults = function() {
        return _inited ? opts : defaults;
    }

    Wire.prototype.init = function(options) {
        if (_inited) return;

        //console.log(options);
        opts = $.extend({}, defaults);
        //console.log(opts);
        opts = $.extend(opts, options);

        opts.id = opts.wire_id + ' ' + opts.wire_container;

        L.Oscars.Dashboard.init({
            //          websocket: 'ws://localhost:8051'
        });

        //console.log(opts, opts.voice);
        install_handlers();
        install_wire();

        _inited = true;

        if (opts.debug) {
            test_wire();
        }

        L.Oscars.Dashboard.broadcast({
            source: 'gip',
            type: 'news',
            subject: 'Dashboard initialized and ready.',
            body: "Ready",
            priority: 1,
            icon: 'fa-info',
            "icon-color": 'success',
            timestamp: Date.now(),
            speak: opts.voice
        });
    };

    function install_handlers() {
        /**
         *  Utility functions
         */
        // Acknowledge Checkbox
        $('input.wire-checkbox').click(function() {
            if (opts.markRead != null) {
                vid = $(this).data('message');
                $.post(
                    opts.markRead, {
                        id: vid
                    },
                    function() {
                        console.log('marked as read ' + vid);
                    }
                );
                $(this).prop('disabled', true);
                //@todo: Set priority to initial priority when ACK
            }
        });

        // More... (only works with plain text)
        // Chops text
        $('.wire-more').each(function() {
            var content = $(this).html().split(" ");
            if (content.length > opts.numWords) {
                var c = content.slice(0, opts.numWords).join(" ");
                var h = content.slice(opts.numWords, content.length).join(" ");
                var html = c + '&nbsp;<span class="wire-more-elipses">' + opts.ellipsestext +
                    '</span>&nbsp;<span class="wire-more-content"><span>' +
                    h + '</span>&nbsp;&nbsp;<a href="" class="wire-more-link">' +
                    opts.moretext + '</a></span>';
                $(this).html(html);
            }
        });

        $(".wire-more-link").click(function() {
            if ($(this).hasClass("wire-less")) {
                $(this).removeClass("wire-less");
                $(this).html(opts.moretext);
            } else {
                $(this).addClass("wire-less");
                $(this).html(opts.lesstext);
            }
            $(this).parent().prev().toggle();
            $(this).prev().toggle();
            return false;
        });


        /**
         *  GIP Message Handler: Handle plain messages
         */
        $("#" + opts.wire_id).on('gip:message', function(event, message) {
            var tags = new Array();
            var addTags = function(str) {
                if (opts.ignoreTags.indexOf(str) == -1)
                    tags.push(str);
            }
            var setPriority = function(msg, max_priority) {
                var priority = parseInt(msg.priority);
                if (isNaN(priority)) priority = 0;
                if (priority > max_priority) priority = max_priority;
                msg.priority = priority;
                return priority;
            }

            if (message.priority < 0) // convention: we do not display wire message with negative priority on the wire.
                return; // they may be handled by other giplet handlers, but they are not displayed on the wire.

            // Priority
            var priority = setPriority(message, opts.priority_map.length);
            var priority_string = '★'.repeat(priority) + '☆'.repeat(opts.priority_map.length - priority);

            // Tags
            addTags(priority_string);
            if (message.source)
                addTags(message.source.toLowerCase());
            if (message.type)
                addTags(message.type.toLowerCase());

            // Color
            var message_color = bootstrapColors[priority % bootstrapColors.length];
            if (message.hasOwnProperty("icon-color")) {
                if (bootstrapColors.indexOf(message["icon-color"]) > -1) { // uses bootstrap color
                    message_color = message["icon-color"]
                    addTags("≈ " + message_color);
                }
            }

            // Icon
            if (typeof message.icon == "undefined") {
                message.icon = opts.icon;
            } else {
                // addTags('<i class="fa '+message.icon+'"></i>');
                addTags("• " + message.icon.toLowerCase().replace(/fa-/, ''));
            }

            // Link
            var title = message.subject;
            if (typeof title == 'undefined') {
                title = 'No subject';
            }
            if (message.link) {
                title = $('<a>').attr('href', message.link).html('<i class="fa fa-link"></i>&nbsp;' + message.subject);
            }

            // ACK Checkbox
            if (message.ack) { // @todo: Raise priority of ACK message to maximum, (re)set priority to initial value after checked.
                title = '<input type="checkbox" value="1" data-message="' + message.id + '" data-priority="' + priority + '">&nbsp;' + title;
            }

            // Body
            var text = message.body;

            // special message parsing
            if (message.type.toLowerCase() == 'metar') {
                var metar = metar_decode(text);
                if (metar.length > 0) {
                    text = metar.replace(/(?:\r\n|\r|\n)/g, '<br />') + '<br/><pre>' + text + '</pre>';
                }
            }
            // text shortening
            if (typeof text != 'undefined') {
                if (opts.numWords > 0) {
                    var content = text.split(" ");
                    if (content.length > opts.numWords) {
                        text = content.slice(0, opts.numWords).join(" ") +
                            '&nbsp;<span class="wire-more-elipses">' + opts.ellipsestext +
                            '</span>&nbsp;<span class="wire-more-content"><span>' +
                            content.slice(opts.numWords, content.length).join(" ") +
                            '</span>&nbsp;&nbsp;<a href="" class="wire-more-link">' +
                            opts.moretext + '</a></span>';
                    }
                }
            } else {
                text = '';
            }

            // Do we need a new Date reminder in the margin?
            if (lastDateReminder == null || ((Date() - lastDateReminder) > (opts.dateReminder * 60000))) {
                $('<li>').addClass('time-label')
                    .append($('<span>').addClass('bg-blue').html(moment().format("ddd D MMM H:mm")))
                    .prependTo("#" + opts.id);
                lastDateReminder = new Date();
            }

            // Tags
            if (message.hasOwnProperty("tags")) {
                tags = tags.concat(message.tags.split(","))
            }


            // Assembly
            var tagPills = $('<span class="message-tag-pills">');
            for (var idx = 0; idx < tags.length; idx++) {
                tagPills.append($('<span>').html(tags[idx])).append('&nbsp;');
            }

            var expjson = opts.debug ? $('<p>').css('margin-top', '10px').html(renderjson(message)) : '';

            //materialadmin-based
            if (title.length > 0 || text.length > 0) {
                var messageId = typeof message.id == "undefined" ? (new Date()).getTime() : message.id;
                $('<li>').addClass('timeline-inverted')
                    .append($('<div>').addClass('timeline-circ').addClass('circ-xl').addClass('style-' + message_color)
                        .append(
                            $('<i>').addClass('fa').addClass(message.icon).html(' ')
                        )
                    )
                    .append($('<div>').addClass('timeline-entry')
                        .append($('<div>').addClass('card').addClass('style-default-bright')
                            .append($('<div>').addClass('card-body').addClass('small-padding')
                                .append(
                                    $('<span>').addClass('message-header')
                                    .append($('<span>').addClass('time').addClass('opacity-50')
                                        .append(
                                            $('<i>').addClass('fa').addClass('fa-clock-o')
                                        )
                                        .append($('<span>')
                                            .attr('style', 'font-weight:bold;font-size:140%;')
                                            .append(moment().format("H:mm")))
                                        .append(moment().format(" ddd D"))
                                    )
                                    .append($('<span>').addClass('title').html(title))
                                )
                                .append(
                                    $('<span>').addClass('message-body').addClass('wire-more').addClass('text-medium').html('<br/>' + text + '<br/>')
                                )
                                .append(
                                    $('<span>').addClass('message-footer')
                                    .append(tagPills)
                                    .append(
                                        $('<span>')
                                        .addClass('text-' + message["icon-color"])
                                        .append($('<p>')
                                            .html('Published on ' + moment(message.created_at).format('ddd D MMM YY H:mm'))
                                        )
                                    )
                                    .append(expjson)
                                )
                            )
                        )
                    )
                    .addClass('wire-message')
                    .attr('data-item-tags', tags.join(','))
                    .attr('id', 'wire-message-' + messageId)
                    .prependTo("#" + opts.id).hide().slideDown(opts.speed);

                // increase alert count indicator if side panel is closed
                if (!$('.sidebar-tabs a[href="#messages"]').parent().hasClass('active')) {
                    var counterSelector = '#alert-counter';
                    var counter = 1 + parseInt($(counterSelector).html());
                    $(counterSelector).html(counter).toggle(true);
                } // otherwise, panel is open and message are seen
                $('#last-updated-time').data('timestamp', new Date().getTime());
            }

            // Cleanup

            // Rebuild task list, sort it, and set those that were active.
            // 1. remember which ones where selected
            var tagsortActive = $('div.tagsort-tags-container span.tagsort-active');
            // 2. rebuild list
            $('div.tagsort-tags-container').html('').tagSort({
                items: '.wire-message'
            }).find('span').sortElements(function(a, b) {
                return $(a).text() > $(b).text() ? 1 : -1;
            });
            // 3. select those which were selected
            var hasTags = 0;
            if (tagsortActive.length !== 0) {
                tagsortActive.each(function() {
                    tag = $(this).html();
                    if (opts.filterNewMessage && (tags.indexOf(tag) > -1)) { // current message has tag
                        hasTags++;
                    }
                    $('div.tagsort-tags-container span:contains("' + tag + '")').addClass('tagsort-active');
                });
            }
            if (opts.filterNewMessage && tagsortActive.length !== hasTags) {
                $('li#wire-message-' + message.id).toggle(false);
            }

            $(".wire-more-link").click(function() {
                if ($(this).hasClass("wire-less")) {
                    $(this).removeClass("wire-less");
                    $(this).html(opts.moretext);
                } else {
                    $(this).addClass("wire-less");
                    $(this).html(opts.lesstext);
                }
                $(this).parent().prev().toggle();
                $(this).prev().toggle();
                return false;
            });
            if ($("#" + opts.wire_id).hasClass('gip-growl')) {
                $.growl({ title: message.subject, message: message.body, style: message_color });
            }

            if (opts.voice && message.speak) {
                var y = window.speechSynthesis;
                if (!y) {
                    console.warn('Your browser does not support `speechSynthesis` yet.');
                } else {
                    var s = new SpeechSynthesisUtterance(message.subject);
                    //s.voice = y.getVoices()[0];
                    // y.speak(s);
                }
            }

        });

        /**
         *  GIP Message Handler: Handle plain messages
         */
        $("#" + opts.map_id).on('gip:update', function(event, feature) {
            // we need to find which layer to update.
            // the layer is supplied through the *_group name property.
            //console.log('L.Oscars::gip:update: Info - ', feature);
            if (feature.properties && feature.properties.group_name) {
                var layer = L.Oscars.Util.findGIPLayer(feature.properties.group_name);
                if (layer) {
                    layer.update(feature);
                } else {
                    console.log("L.Oscars::gip:update: Warning - Cannot find GIP layer", feature);
                }
            } else {
                console.log("L.Oscars::gip:update: Warning - Feature has no group name", feature);
            }
        });

    } // install_handlers()

    function install_wire() {
        $("#the-wire").sieve({
            itemSelector: ".wire-message",
            searchTemplate: "<div class='o-search'><i class='fa fa-search'>&nbsp;</i><input type='text' id='sieveSearch' class='form-control' placeholder='Enter text to search...'>&nbsp;<i class='fa fa-remove'></i></div>"
        });

        $('.sidebar-tabs a[href="#messages"]').click(function(event) {
            var lastUpdatedTimestamp = $('#last-updated-time').data('timestamp');
            if (typeof lastUpdatedTimestamp != "undefined") {
                $('#last-updated-time').html(moment.unix(lastUpdatedTimestamp / 1000).fromNow());
            }
            $('#alert-counter').html(0).toggle(false);
        })

        $(".sound-onoff").click(function() {
            var that = $(".sound-onoff i");

            if (opts.voice) {
                that.removeClass('fa-volume-up');
                that.addClass('fa-volume-off');
                opts.voice = false;
            } else {
                that.removeClass('fa-volume-off');
                that.addClass('fa-volume-up');
                opts.voice = true;
            }
        });

        $(".sound-onoff i").trigger('click');

        $(".clean-wire").click(function() {
            $("li.wire-message").remove();
            $('#alert-counter').html(0).toggle(false);
            //this info message help reset tags
            L.Oscars.Dashboard.broadcast({ source: 'gip', type: 'info', subject: 'Wire reset', priority: 1, icon: 'fa-info', "icon-color": 'info' });
        });

        $(".o-search .fa-remove").click(function() {
            $("#sieveSearch").val('').trigger('change');
        });

        setInterval(function() {
            var stats = L.Oscars.Util.getStats();
            console.log('stats', stats);
            L.Oscars.Dashboard.broadcast({
                source: 'gip',
                type: 'stats',
                subject: 'Map Usage Statistics',
                body: '<pre>' + JSON.stringify(stats, null, 2) + '</pre>',
                priority: 1,
                icon: 'fa-bar-chart',
                "icon-color": 'info',
                timestamp: (new Date().getTime())
            });
        }, 600000);
    } // install_wire()

    function test_wire() {
        const tmax = 10000
        setTimeout(function() { // starts in 5000 msec
            L.Oscars.Dashboard.broadcast({ source: 'gip', type: 'news', subject: 'DASHBOARD TESTING STARTED...', priority: 5, icon: 'fa-info', "icon-color": 'accent' });
        }, 10);
        setTimeout(function() { // starts in 5000 msec
            L.Oscars.Dashboard.broadcast({ source: 'gip', type: 'news', subject: '... DASHBOARD TESTING COMPLETED!', body: "Please check the browser's console for log", priority: 2, icon: 'fa-info', "icon-color": 'success', timestamp: 1495470000000, speak: false });
        }, tmax);

        [ // test messages
            { source: 'gip', type: 'metar', body: 'EBLG 300450Z 34007KT 1600 RA BR FEW002 BKN003 15/13 Q1005 TEMPO 1200 RADZ BKN002', subject: 'Metar EBLG 300450Z', priority: 1, icon: 'fa-cloud', "icon-color": 'info' }, {
                source: 'gip',
                type: 'lorem',
                ack: true,
                body: 'Quaestione igitur per multiplices dilatata fortunas cum ambigerentur quaedam, non nulla levius actitata constaret, post multorum clades Apollinares ambo pater et filius in exilium acti cum ad locum Crateras nomine pervenissent, villam scilicet suam quae ab Antiochia vicensimo et quarto disiungitur lapide, ut mandatum est, fractis cruribus occiduntur.' +
                    'Alii nullo quaerente vultus severitate adsimulata patrimonia sua in inmensum extollunt, cultorum ut puta feracium multiplicantes annuos fructus, quae a primo ad ultimum solem se abunde iactitant possidere, ignorantes profecto maiores suos, per quos ita magnitudo Romana porrigitur, non divitiis eluxisse sed per bella saevissima, nec opibus nec victu nec indumentorum vilitate gregariis militibus discrepantes opposita cuncta superasse virtute.' +
                    'Ac ne quis a nobis hoc ita dici forte miretur, quod alia quaedam in hoc facultas sit ingeni, neque haec dicendi ratio aut disciplina, ne nos quidem huic uni studio penitus umquam dediti fuimus. Etenim omnes artes, quae ad humanitatem pertinent, habent quoddam commune vinculum, et quasi cognatione quadam inter se continentur.',
                subject: 'Lorem Ipsum — Extra Link Tester',
                priority: 1,
                icon: 'fa-info',
                "icon-color": 'default'
            }, { source: 'aodb', type: 'qfu', subject: "QFU Changed to 05", priority: 6, icon: "fa-plane" }, { source: 'aodb', type: 'notam', subject: "A1234/06 NOTAMR A1212/06", body: "A1234/06 NOTAMR A1212/06<br/>Q)EGTT/QMXLC/IV/NBO/A/000/999/5129N00028W005<br/>A)EGLL<br/>B)0609050500<br/>C)0704300500<br/>E)DUE WIP TWY B SOUTH CLSD BTN 'F' AND 'R'. TWY 'R' CLSD BTN 'A' AND 'B' AND DIVERTED VIA NEW GREEN CL AND BLUE EDGE LGT.<br/>CTN ADZ", priority: 4, icon: 'fa-plane', "icon-color": 'warning' }
        ].forEach(function(msg, idx) {
            setTimeout(function() { // starts in 5000 msec
                L.Oscars.Dashboard.broadcast(msg);
            }, tmax * Math.random());
        })

        L.Oscars.Dashboard.print.info("Info", "test")
        L.Oscars.Dashboard.print.warning("Warning", "test")
        L.Oscars.Dashboard.print.error("Error", "test")

    } // test_wire()


    return Wire.prototype;

})(jQuery);
/*
 * Oscars Geo Intelligent Platform Viewer
 * 
 * 2020 Pierre M
 * License: MIT
 *
 * Wire giplet diplays messages it receives.
 * Offer a search box (sieve) and tag filtering/selection.
 */
"use strict"
const VERSION = "5.0.0"
const MODULE_NAME = "Wire"

import * as Util from './O-utils.js'

/**
 *  DEFAULT VALUES
 */
const DEFAULTS = {
    debug: false,
    elemid: "wire_id",
    msgtype: "wire",
    voice: false,
    wire_container: "ul",
    markRead: null, // 'gipadmin/wire/read'
    // General presentation
    icon: 'la-info',
    "icon-color": 'default',
    "icon-set": "la-",
    size: 'medium',
    speed: 500,
    dateReminder: 3, // minutes
    // More
    numWords: 50,
    ellipsestext: '<i class="fa la-ellipsis-h"></i>',
    moretext: '<i class="fa la-angle-double-right"></i>',
    lesstext: '<i class="fa la-angle-double-left"></i>',
    //
    ignoreTags: ['default', 'unknown'],
    filterNewMessage: false
}

const BOOTSTRAP_COLORS = [
    'primary',
    'secondary',
    'success',
    'danger',
    'warning',
    'info',
    'accent',
    'default'
]
const BOOTSTRAP_COLOR_VARIANTS = [
    'bright',
    'light',
    'normal',
    'dark'
]

/**
 *  PRIVATE VARIABLES
 */
var _options = false
var _dashboard = null
var _lastDateReminder = null


/**
 *  PRIVATE FUNCTIONS
 */


/**
 *  PUBLIC FUNCTIONS
 */

// Only gets called when we're using $('$el').dashboard format
function init(options, dashboard) { // note Oscars.Dashboard.init should have been called before...
    if (_options)
        return _options

    _options = Util.extend(DEFAULTS, options)

    _options.id = _options.elemid + ' ' + _options.wire_container

    if(dashboard) {
        _dashboard = dashboard
    }

    install_handlers()
    install_wire()

    if (_options.debug && _dashboard) {
        _dashboard.broadcast({
            type: "wire",
            payload: {
                source: 'gip',
                type: 'news',
                subject: 'Wire ready',
                body: "Wire initialized and ready.",
                priority: 1,
                icon: 'la-info',
                "icon-color": 'success',
                timestamp: Date.now(),
                speak: false
            }
        })
    }

    if (_options.debug) {
        run_tests()
    }

    return _options
}


function getElemId() {
    return _options.elemid
}

function getTemplate() {
    return $('<div>')
        .append($('<div>')
            .attr("id", _options.elemid)
            .append($('<div>')
                .addClass("simulated-time"))
            .append($('<header>')
                .addClass("wire-top")
                .append($('<div>')
                    .addClass("wire-seave"))
                .append($('<div>')
                    .addClass("wire-tagsort")
                    .append($('<div>')
                        .addClass("tagsort-tags-container"))))
            .append($('<div>')
                .addClass("wire-tagsort")
                .append($('<ul>')
                    .attr("id", "the-wire")
                    .addClass("timeline")
                    .addClass("collapse-lg")
                    .addClass("timeline-hairline")
                    .addClass("cd-timeline"))))
}

function install_handlers() {
    /**
     *  Utility functions
     */
    // Acknowledge Checkbox
    $('input.wire-checkbox').click(function() {
        if (_options.markRead != null) {
            vid = $(this).data('message')
            $.post(
                _options.markRead, {
                    id: vid
                },
                function() {
                    console.log(MODULE_NAME, "::onClick: marked as read " + vid)
                }
            )
            $(this).prop('disabled', true)
            //@todo: Set priority to initial priority when ACK
        }
    })

    // More... (only works with plain text)
    // Chops text
    $('.wire-more').each(function() {
        var content = $(this).html().split(" ")
        if (content.length > _options.numWords) {
            var c = content.slice(0, _options.numWords).join(" ")
            var h = content.slice(_options.numWords, content.length).join(" ")
            var html = c + '&nbsp;<span class="wire-more-elipses">' + _options.ellipsestext +
                '</span>&nbsp;<span class="wire-more-content"><span>' +
                h + '</span>&nbsp;&nbsp;<a href="" class="wire-more-link">' +
                _options.moretext + '</a></span>'
            $(this).html(html)
        }
    })

    $(".wire-more-link").click(function() {
        if ($(this).hasClass("wire-less")) {
            $(this).removeClass("wire-less")
            $(this).html(_options.moretext)
        } else {
            $(this).addClass("wire-less")
            $(this).html(_options.lesstext)
        }
        $(this).parent().prev().toggle()
        $(this).prev().toggle()
        return false
    })


    /**
     *  GIP Message Handler: Handle plain messages
     */
    _dashboard.register(_options.elemid, _options.msgtype)
    $("#" + _dashboard.getElemPrefix() + _options.elemid).on(_dashboard.getMessagePrefix() + _options.msgtype, function(event, message) {
        if (_options.debug)
            console.log(MODULE_NAME, "on", _options.elemid, _options.msgtype, message)

        if (!message.hasOwnProperty("id"))
            message.id = (new Date()).getTime()

        var tags = new Array()
        var addTags = function(str) {
            if (_options.ignoreTags.indexOf(str) == -1)
                tags.push(str)
        }
        var setPriority = function(msg, max_priority) {
            var priority = parseInt(msg.priority)
            if (isNaN(priority)) priority = 0
            if (priority > max_priority) priority = max_priority
            msg.priority = priority
            return priority
        }

        if (message.priority < 0) // convention: we do not display wire message with negative priority on the wire.
            return // they may be handled by other giplet handlers, but they are not displayed on the wire.

        // Priority
        var priority = setPriority(message, _options.BOOTSTRAP_COLOR_VARIANTS.length)
        var priority_string = '★'.repeat(priority) + '☆'.repeat(_options.BOOTSTRAP_COLOR_VARIANTS.length - priority)

        // Tags
        addTags(priority_string)
        if (message.source)
            addTags(message.source.toLowerCase())
        if (message.type)
            addTags(message.type.toLowerCase())

        // Color
        var message_color = BOOTSTRAP_COLORS[priority % BOOTSTRAP_COLORS.length]
        if (message.hasOwnProperty("icon-color")) {
            if (BOOTSTRAP_COLORS.indexOf(message["icon-color"]) > -1) { // uses bootstrap color
                message_color = message["icon-color"]
                addTags("≈ " + message_color)
            }
        }

        // Icon
        if (typeof message.icon == "undefined") {
            message.icon = _options.icon
        } else {
            // addTags('<i class="fa '+message.icon+'"></i>')
            addTags("• " + message.icon.toLowerCase().replace(/la-/, ''))
        }

        // Link
        var title = message.subject
        if (typeof title == 'undefined') {
            title = 'No subject'
        }
        if (message.link) {
            title = $('<a>').attr('href', message.link).html('<i class="la-xs la-link"></i>&nbsp;' + message.subject)
        }

        // ACK Checkbox
        if (message.ack) { // @todo: Raise priority of ACK message to maximum, (re)set priority to initial value after checked.
            title = '<input type="checkbox" value="1" data-message="' + message.id + '" data-priority="' + priority + '">&nbsp;' + title
        }

        // Body
        var text = message.body

        // special message parsing
        if (message.type.toLowerCase() == 'metar') {
            var metar = metar_decode(text)
            if (metar.length > 0) {
                text = metar.replace(/(?:\r\n|\r|\n)/g, '<br />') + '<br/><pre>' + text + '</pre>'
            }
        }
        // text shortening
        if (typeof text != 'undefined') {
            if (_options.numWords > 0) {
                var content = text.split(" ")
                if (content.length > _options.numWords) {
                    text = content.slice(0, _options.numWords).join(" ") +
                        '&nbsp;<span class="wire-more-elipses">' + _options.ellipsestext +
                        '</span>&nbsp;<span class="wire-more-content"><span>' +
                        content.slice(_options.numWords, content.length).join(" ") +
                        '</span>&nbsp;&nbsp;<a href="" class="wire-more-link">' +
                        _options.moretext + '</a></span>'
                }
            }
        } else {
            text = ''
        }

        // Do we need a new Date reminder in the margin?
        if (_lastDateReminder == null || ((Date() - _lastDateReminder) > (_options.dateReminder * 60000))) {
            $('<li>').addClass('time-label')
                .append($('<span>').addClass('bg-blue').html(moment().format("ddd D MMM H:mm")))
                .prependTo("#" + _options.id)
            console.log('date added', _lastDateReminder)
            _lastDateReminder = new Date()
        }

        // Tags
        if (message.hasOwnProperty("tags")) {
            tags = tags.concat(message.tags.split(","))
        }


        // Assembly
        var tagPills = $('<span class="message-tag-pills">')
        for (var idx = 0; idx < tags.length; idx++) {
            tagPills.append($('<span>').html(tags[idx])).append('&nbsp;')
        }

        var expjson = _options.debug ? $('<p>').css('margin-top', '10px').html(renderjson(message)) : ''

        //materialadmin-based, should be done by mustache?
        if (title.length > 0 || text.length > 0) {
            $('<li>').addClass('timeline-inverted')
                .append($('<div>').addClass('timeline-circ').addClass('circ-xl').addClass('style-' + message_color)
                    .append(
                        $('<i>').addClass('la').addClass('la-3x').addClass(message.icon.replace(/fa/, "la")).html(' ')
                    )
                )
                .append($('<div>').addClass('timeline-entry')
                    .append($('<div>').addClass('card').addClass('style-default-bright')
                        .append($('<div>').addClass('card-body').addClass('small-padding')
                            .append(
                                $('<span>').addClass('message-header')
                                .append($('<span>').addClass('time').addClass('opacity-50')
                                    .append(
                                        $('<i>').addClass('fa').addClass('la-clock-o')
                                    )
                                    .append($('<span>')
                                        .attr('style', 'font-weight:boldfont-size:140%')
                                        .append(moment(message.created_at).format("H:mm")))
                                    .append(moment(message.created_at).format(" ddd D"))
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
                                        .html('Published on ' + moment().format('ddd D MMM YY H:mm'))
                                    )
                                )
                                .append(expjson)
                            )
                        )
                    )
                )
                .addClass('wire-message')
                .attr('data-item-tags', tags.join(','))
                .attr('id', 'wire-message-' + message.id)
                .prependTo("#" + _options.id).hide().slideDown(_options.speed)

            // increase alert count indicator if side panel is closed
            if (!$('.sidebar-tabs a[href="#messages"]').parent().hasClass('active')) {
                var counterSelector = '#alert-counter'
                var counter = 1 + parseInt($(counterSelector).html())
                $(counterSelector).html(counter).toggle(true)
            } // otherwise, panel is open and message are seen
            $('#last-updated-time').data('timestamp', new Date().getTime())
        }

        // Cleanup

        // Rebuild task list, sort it, and set those that were active.
        // 1. remember which ones where selected
        var tagsortActive = $('div.tagsort-tags-container span.tagsort-active')
        // 2. rebuild list
        $('div.tagsort-tags-container').html('').tagSort({
            items: '.wire-message'
        }).find('span').sortElements(function(a, b) {
            return $(a).text() > $(b).text() ? 1 : -1
        })
        // 3. select those which were selected
        var hasTags = 0
        if (tagsortActive.length !== 0) {
            tagsortActive.each(function() {
                tag = $(this).html()
                if (_options.filterNewMessage && (tags.indexOf(tag) > -1)) { // current message has tag
                    hasTags++
                }
                $('div.tagsort-tags-container span:contains("' + tag + '")').addClass('tagsort-active')
            })
        }
        if (_options.filterNewMessage && tagsortActive.length !== hasTags) {
            $('li#wire-message-' + message.id).toggle(false)
        }

        $(".wire-more-link").click(function() {
            if ($(this).hasClass("wire-less")) {
                $(this).removeClass("wire-less")
                $(this).html(_options.moretext)
            } else {
                $(this).addClass("wire-less")
                $(this).html(_options.lesstext)
            }
            $(this).parent().prev().toggle()
            $(this).prev().toggle()
            return false
        })
        if ($("#" + _options.elemid).hasClass('gip-growl')) {
            $.growl({ title: message.subject, message: message.body, style: message_color })
        }

        if (_options.voice && message.speak) {
            var y = window.speechSynthesis
            if (!y) {
                console.warn('Your browser does not support `speechSynthesis` yet.')
            } else {
                var s = new SpeechSynthesisUtterance(message.subject)
                //s.voice = y.getVoices()[0]
                y.speak(s)
            }
        }

    })

} // install_handlers()


function install_wire() {
    $("#the-wire").sieve({
        itemSelector: ".wire-message",
        searchTemplate: "<div class='o-search'><i class='la la-search'>&nbsp;</i><input type='text' id='sieveSearch' class='oscars form-control' placeholder='Enter text to search...'>&nbsp;<i class='la la-remove'></i></div>"
    })

    $('.sidebar-tabs a[href="#messages"]').click(function(event) {
        var lastUpdatedTimestamp = $('#last-updated-time').data('timestamp')
        if (typeof lastUpdatedTimestamp != "undefined") {
            $('#last-updated-time').html(moment.unix(lastUpdatedTimestamp / 1000).fromNow())
        }
        $('#alert-counter').html(0).toggle(false)
    })

    $(".sound-onoff").click(function() {
        var that = $(".sound-onoff i")

        if (_options.voice) {
            that.removeClass('la-volume-up')
            that.addClass('la-volume-off')
            _options.voice = false
        } else {
            that.removeClass('la-volume-off')
            that.addClass('la-volume-up')
            _options.voice = true
        }
    })

    $(".sound-onoff i").trigger('click')

    $(".clean-wire").click(function() {
        $("li.wire-message").remove()
        $('#alert-counter').html(0).toggle(false)
        //this info message help reset tags
        _dashboard.broadcast({
            type: "wire",
            payload: { source: 'gip', type: 'info', subject: 'Wire reset', priority: 1, icon: 'la-info', "icon-color": 'info' }
        })
    })

    $(".o-search .la-remove").click(function() {
        $("#sieveSearch").val('').trigger('change')
    })

    setInterval(function() {
        var stats = Oscars.Map.getStats()
        console.log('stats', stats)
        _dashboard.broadcast({
            type: "wire",
            payload: {
                source: 'gip',
                type: 'stats',
                subject: 'Map Usage Statistics',
                body: '<pre>' + JSON.stringify(stats, null, 2) + '</pre>',
                priority: 1,
                icon: 'la-bar-chart',
                "icon-color": 'info',
                timestamp: (new Date().getTime())
            }
        })
    }, 600000)
} // install_wire()


function run_tests(dashboard) {
    const tmax = 10000
    setTimeout(function() { // starts in 5000 msec
        dashboard.broadcast({ type: "wire", payload: { source: 'gip', type: 'news', subject: 'DASHBOARD TESTING STARTED...', priority: 5, icon: 'la-info', "icon-color": 'accent' } })
    }, 10)
    setTimeout(function() { // starts in 5000 msec
        dashboard.broadcast({ type: "wire", payload: { source: 'gip', type: 'news', subject: '... DASHBOARD TESTING COMPLETED!', body: "Please check the browser's console for log", priority: 2, icon: 'la-info', "icon-color": 'success', timestamp: 1495470000000, speak: false } })
    }, tmax)

    const data = [ // test messages
        { source: 'gip', type: 'metar', body: 'EBLG 300450Z 34007KT 1600 RA BR FEW002 BKN003 15/13 Q1005 TEMPO 1200 RADZ BKN002', subject: 'Metar EBLG 300450Z', priority: 1, icon: 'la-cloud', "icon-color": 'info' }, {
            source: 'gip',
            type: 'lorem',
            ack: true,
            body: 'Quaestione igitur per multiplices dilatata fortunas cum ambigerentur quaedam, non nulla levius actitata constaret, post multorum clades Apollinares ambo pater et filius in exilium acti cum ad locum Crateras nomine pervenissent, villam scilicet suam quae ab Antiochia vicensimo et quarto disiungitur lapide, ut mandatum est, fractis cruribus occiduntur.' +
                'Alii nullo quaerente vultus severitate adsimulata patrimonia sua in inmensum extollunt, cultorum ut puta feracium multiplicantes annuos fructus, quae a primo ad ultimum solem se abunde iactitant possidere, ignorantes profecto maiores suos, per quos ita magnitudo Romana porrigitur, non divitiis eluxisse sed per bella saevissima, nec opibus nec victu nec indumentorum vilitate gregariis militibus discrepantes opposita cuncta superasse virtute.' +
                'Ac ne quis a nobis hoc ita dici forte miretur, quod alia quaedam in hoc facultas sit ingeni, neque haec dicendi ratio aut disciplina, ne nos quidem huic uni studio penitus umquam dediti fuimus. Etenim omnes artes, quae ad humanitatem pertinent, habent quoddam commune vinculum, et quasi cognatione quadam inter se continentur.',
            subject: 'Lorem Ipsum — Extra Link Tester',
            priority: 1,
            icon: 'la-info',
            "icon-color": 'default'
        }, { source: 'aodb', type: 'qfu', subject: "QFU Changed to 05", priority: 6, icon: "la-plane" }, { source: 'aodb', type: 'notam', subject: "A1234/06 NOTAMR A1212/06", body: "A1234/06 NOTAMR A1212/06<br/>Q)EGTT/QMXLC/IV/NBO/A/000/999/5129N00028W005<br/>A)EGLL<br/>B)0609050500<br/>C)0704300500<br/>E)DUE WIP TWY B SOUTH CLSD BTN 'F' AND 'R'. TWY 'R' CLSD BTN 'A' AND 'B' AND DIVERTED VIA NEW GREEN CL AND BLUE EDGE LGT.<br/>CTN ADZ", priority: 4, icon: 'la-plane', "icon-color": 'warning' }
    ]

    data.forEach(function(msg, idx) {
        setTimeout(function() { // starts in 5000 msec
            dashboard.broadcast({ type: "wire", payload: msg })
        }, tmax * Math.random())
    })

} // test_wire()


/**
 *  MODULE EXPORTS
 */
function version() {
    console.log(MODULE_NAME, VERSION);
}

export {
    init,
    version,
    getElemId,
    getTemplate
}
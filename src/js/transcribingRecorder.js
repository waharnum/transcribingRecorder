(function ($, fluid) {

    fluid.defaults("sjrk.voiceRecorder", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            record: ".sjrk-voiceRecorder-record",
            stop: ".sjrk-voiceRecorder-stop"
        },
        members: {
            template: "<form><button class='sjrk-voiceRecorder-record' type='button'>Record</button>  <button class='sjrk-voiceRecorder-stop' type='button'>Stop</button></form>",
            chunks: [],
            transcriptStart: null,
            transcript: [],
            interimTranscript: []
        },
        listeners: {
            "onCreate.initializeRecording": {
                "funcName": "sjrk.voiceRecorder.initializeRecording",
                "args": ["{that}"]
            },
            "onCreate.appendTemplate": {
                "this": "{that}.container",
                "method": "append",
                "args": ["{that}.template"],
                "priority": "after:initializeRecording"
            },
            "onCreate.bindControls": {
                "funcName": "sjrk.voiceRecorder.bindControls",
                "args": ["{that}"],
                "priority": "after:appendTemplate"
            }
        },
        invokers: {
            "record": {
                funcName: "sjrk.voiceRecorder.record",
                args: "{that}"
            },
            "stop": {
                funcName: "sjrk.voiceRecorder.stop",
                args: "{that}"
            }
        }
    });

    sjrk.voiceRecorder.initializeRecording = function (that) {
        navigator.getUserMedia (
            {
                audio: true
            },
            function(stream) {
                that.mediaRecorder = new MediaRecorder(stream);
            },
            function(err) {
                 console.log('The following gUM error occured: ' + err);
            }
        );
        that.speechRecognition = new webkitSpeechRecognition();
        that.speechRecognition.continuous = true;
        that.speechRecognition.interimResults = true;
    };

    sjrk.voiceRecorder.bindControls = function (that) {
        console.log("bindControls");
        fluid.each(["record", "stop"], function(controlName) {

            var button = that.locate(controlName);
            button.click(function () {
                that[controlName]();
            });
        });
    };

    sjrk.voiceRecorder.record = function (that) {
        console.log("Record");
        that.mediaRecorder.start();

        var date = new Date();
        date = date.toUTCString();
        that.transcriptStart = date;

        var recogEvents = ["onaudiostart", "onaudioend", "onsoundstart", "onsoundend", "onspeechstart", "onspeechend"];

        fluid.each(recogEvents, function (recogEvent) {
            that.speechRecognition[recogEvent] = function (e) {
                var date = new Date();
                date = date.toUTCString();
                console.log("Speech recognition event of type " + recogEvent + " occured at " + date, e);
            };
        });

        that.speechRecognition.onresult =
        (function (e) {

            var currentTime = new Date();
            var transcriptStart = new Date(that.transcriptStart);
            var timeFromStart = (currentTime.getTime() - transcriptStart.getTime()) / 1000;

            var transcriptArrayLength = that.transcript.length;

            var isFinal = e.results[transcriptArrayLength].isFinal;
            var transcript = e.results[transcriptArrayLength][0].transcript;
            if(!isFinal) {
                if(! that.interimTranscript[transcriptArrayLength]) {
                    that.interimTranscript[transcriptArrayLength] = {start: timeFromStart, transcript: transcript};
                }
                console.log(that.interimTranscript);
            }
            if(isFinal) {
                that.transcript.push({end: timeFromStart, transcript: transcript});
            console.log(transcript);
            }

        });

        that.speechRecognition.start();
    };

    sjrk.voiceRecorder.stop = function (that) {
        console.log("Stop");

        that.mediaRecorder.ondataavailable = function (e) {
            that.chunks.push(e.data);
            var blob = new Blob(that.chunks, { 'type' : 'audio/ogg; codecs=opus' });
            that.chunks = [];
            var audioURL = window.URL.createObjectURL(blob);
            var playerMarkup = "<audio controls src='" + audioURL + "'></audio>";

            var displayedTranscript = [];
            fluid.each(that.transcript, function (transcriptItem, idx) {
                var templateValues = {
                    transcript: transcriptItem.transcript,
                    end: transcriptItem.end,
                    start: that.interimTranscript[idx].start
                };

                var transcriptLine = fluid.stringTemplate("%start - %end %transcript", templateValues);
                displayedTranscript.push(transcriptLine);
            });

            var transcriptMarkup = "<p>" + displayedTranscript.join("<br/>") + "</p>";
            that.container.append(playerMarkup);
            that.container.append("<h2>" + that.transcriptStart + "</h2>");
            that.container.append(transcriptMarkup);
            that.container.append("<hr />");
            that.transcript = [];
            that.interimTranscript = [];
            that.transcriptStart = null;
            console.log(that);
        };
        that.mediaRecorder.stop();
        that.speechRecognition.stop();
    };

})(jQuery, fluid);

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
            transcript: []
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
    };

    sjrk.voiceRecorder.bindControls = function (that) {
        console.log("bindControls");
        fluid.each(["record", "pause", "stop"], function(controlName) {

            var button = that.locate(controlName);
            button.click(function () {
                that[controlName]();
            });
        });
    };

    sjrk.voiceRecorder.record = function (that) {
        console.log("Record");
        that.mediaRecorder.start();

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
            var transcriptArrayLength = that.transcript.length;
            console.log(transcriptArrayLength, e.results);
            var transcript = e.results[transcriptArrayLength][0].transcript;
            that.transcript.push(transcript);
            console.log(transcript);
        });

        that.speechRecognition.start();
        console.log(that.mediaRecorder.state);
    };

    sjrk.voiceRecorder.stop = function (that) {
        console.log("Stop");
        console.log(that.speechRecognition);

        that.mediaRecorder.ondataavailable = function (e) {
            that.chunks.push(e.data);
            var blob = new Blob(that.chunks, { 'type' : 'audio/ogg; codecs=opus' });
            that.chunks = [];
            console.log(blob);
            var audioURL = window.URL.createObjectURL(blob);
            console.log(audioURL);
            var playerMarkup = "<audio controls src='" + audioURL + "'></audio>";

            var displayedTranscript = that.transcript.join(" ");
            that.transcript = [];
            var transcriptMarkup = "<p>" + displayedTranscript + "</p>";
            that.container.append(playerMarkup);
            that.container.append(transcriptMarkup);
            that.container.append("<hr />");
        };
        that.mediaRecorder.stop();
        that.speechRecognition.stop();
        console.log(that.mediaRecorder.state);
    };

})(jQuery, fluid);

import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Button, Input } from 'antd';
import { AudioOutlined } from '@ant-design/icons';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Speech from 'speak-tts';

const { Search } = Input;
const DOMAIN = "http://localhost:5001";

const searchContainer = {
    display: "flex",
    justifyContent: "center",
};

const ChatComponent = (props) => {
    const { handleResp, isLoading, setIsLoading } = props;
    
    // define a state variable to keep track of the search value
    const [searchValue, setSearchValue] = useState("");
    const [isChatModeOn, setIsChatModeOn] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [speech, setSpeech] = useState();

    // speech recognition
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable,
    } = useSpeechRecognition();

    // dependency array发生变化时，useEffect会自动自行；如果依赖项数组为空，则useEffect只会在组件挂载和卸载时运行一次；如果没有提供依赖项数组，则useEffect将在每次渲染后运行。
    useEffect(() => {
        const initialized_speech = new Speech();
        initialized_speech
            .init({
                volume: 1,
                lang: "en-US",
                rate: 1,
                pitch: 1,
                voice: "Google US English",
                splitSentences: false,
            })
            .then((data) => {
                // The "data" object contains the list of available voices and the voice synthesis params
                console.log("Speech is ready, voices are available", data);
                setSpeech(initialized_speech);
            })
            .catch((e) => {
                console.error("An error occured while initializing : ", e);
            });
    }, []);

    useEffect(() => {
        if (!listening && Boolean(transcript)) {
            (async () => await onSearch(transcript))();
            setIsRecording(false);
        }
    }, [listening, transcript]);

    const talk = (what2say) => {
        speech
        .speak({
            text: what2say,
            queue: false,   // current speech will be interrupted
            listners: {
                onstart: () => {
                    console.log("Start utterance");
                },
                onend: () => {
                    console.log("End utterance");
                },
                onresume: () => {
                    console.log("Resume utterance");
                },
                onboundary: (event) => {
                    console.log(
                        event.name + 
                        " boundary reached after " + 
                        event.elapsedTime + 
                        " milliseconds."
                    );
                },
            },
        })
        .then(() => {
            // if everything went well, start listening again
            console.log("Success !");
            userStartConvo();
        })
        .catch((e) => {
            console.error("An error occurred: ", e);
        });
    };

    const userStartConvo = () => {
        SpeechRecognition.startListening();
        setIsRecording(true);
        resetTranscript();
    }

    const chatModeClickHandler = () => {
        setIsChatModeOn(!isChatModeOn);
        setIsRecording(false);
        SpeechRecognition.stopListening();

        resetTranscript();
    };

    const recordingClickHandler = () => {
        if (isRecording) {
            setIsRecording(false);
            SpeechRecognition.stolListening();

            resetTranscript();
        } else {
            setIsRecording(true);
            SpeechRecognition.startListening();
        }
    };

    const onSearch = async (question) => {
        // clear the search input
        setSearchValue("");
        setIsLoading(true);

        try {
            const response = await axios.get(`${DOMAIN}/chat`, {
                params: {
                    question,
                },
            });
            handleResp(question, response.data);
            if (isChatModeOn) {
                talk(response.data?.ragAnswer);
            }
        } catch (error) {
            console.error(`Error: ${error}`);
            handleResp(question, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        // update searchValue state when user types in the input box
        setSearchValue(e.target.value);
    };

    return (
        <div style={searchContainer}>
            {!isChatModeOn && (
                <Search
                placeholder="input search text"
                enterButton="Ask"
                size="large"
                onSearch={onSearch}
                loading={isLoading}
                value={searchValue} // Control the value
                onChange={handleChange} // Update the value when changed
                />
            )}
            <Button
                type="primary"
                size="large"
                danger={isChatModeOn}
                onClick={chatModeClickHandler}
                style={{ marginLeft: "5px" }}
            >
                Chat Mode: {isChatModeOn ? "On" : "Off"}
            </Button>
            {isChatModeOn && (
                <Button
                type="primary"
                icon={<AudioOutlined />}
                size="large"
                danger={isRecording}
                onClick={recordingClickHandler}
                style={{ marginLeft: "5px" }}
                >
                {isRecording ? "Recording..." : "Click to record"}
                </Button>
            )}
        </div>
    );
}

export default ChatComponent;
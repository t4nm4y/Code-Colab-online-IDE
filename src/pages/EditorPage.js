import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { PlayFill } from 'react-bootstrap-icons';
import axios from "axios";
import qs from 'qs';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const editorRef = useRef(null);
    const langRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);

    const [codeOutput, setData] = useState(null);
    const [inputText, setInputText] = useState("");

    const ref = useRef(null);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    //we only broadcast the message to other users not to the one who has joined
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                        lang: langRef.current
                    });
                    // document.getElementById("langOption").value=langRef.current;
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        //add all the clients except the one who has left 
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();

        //to close all the listeners, return in useEffect is used as a cleaning function
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    const setLanguage = (e) => {
        editorRef.current.setOption("mode", e.target.value)
        langRef.current = e.target.value
        if (e.target.value === 'text/x-c++src') {
            editorRef.current.setValue("#include <iostream>\nusing namespace std;\nint main() {\n  // Write C++ code here\n  cout << \"Hello world!\";\n  return 0;\n}")
        }
        else if (e.target.value === 'text/x-java') {
            editorRef.current.setValue("class Func {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, World!\");\n  }\n}")
        }
        else if (e.target.value === 'text/x-python') {
            editorRef.current.setValue("print(\"Hello world\")")
        }
        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code: editorRef.current.getValue(),
            lang: null
        });
    };

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    async function copyCode() {
        try {
            await navigator.clipboard.writeText(codeRef.current);
            toast.success('Code has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Code');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    //code output ------------------------------------------------------------------------------------------------------

    function getOutput() {
        const selectedIndex = document.getElementById("langOption").selectedIndex;
        const currLang = document.getElementById("langOption").options[selectedIndex].label;

        const data = qs.stringify({
            'code': codeRef.current,
            'language': currLang,
            'input': inputText
        });

        const config = {
            method: 'post',
            url: 'https://api.codex.jaagrav.in',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: data
        };
        axios(config)
            .then(function (response) {
                // console.log("resp: ",response);
                if (response.data.error) {
                    setData("Error:\n" + response.data.error)
                }
                else {
                    setData(response.data.output)
                }
            })
            .catch(function (error) {
                console.log(error);
                setData("The prev api was getting slow,\nSo I'm working on a new api.\nIt will be live soon")
            });
    };

    function runCode() {
        if (langRef.current) {
            getOutput();
        }
        else {
            alert("Please select a language!")
        }
    }

    //resize input, output text box div----------------------------------------------------------------
    let x = 0;
    let w = 0;
    const ele = document.getElementById('resizeMe');
    const mouseDownHandler = (e) => {
        // Get the current mouse position
        x = e.clientX;

        // Calculate the dimension of element
        const styles = window.getComputedStyle(ele);

        w = parseInt(styles.width);
        // Attach the listeners to `document`
        ref.current.addEventListener('mousemove', mouseMoveHandler);
        ref.current.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (e) => {
        const dx = x - e.clientX;
        ele.style.width = `${w + dx}px`;
    };

    const mouseUpHandler = () => {
        // Remove the handlers of `mousemove` and `mouseup`
        ref.current.removeEventListener('mousemove', mouseMoveHandler);
        ref.current.removeEventListener('mouseup', mouseUpHandler);
    };

    //if don't get the usename as state, then we will redirect it back to the home page
    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className='main'>
            <div className='upperPanel'>
                <div className='options'>
                    <label class="visually-hidden" for="autoSizingSelect">Language: &nbsp;</label>
                    <select class="form-select" id="langOption" onChange={setLanguage}>
                        <option selected>Select</option>
                        <option value="text/x-c++src">cpp</option>
                        <option value="text/x-python">py</option>
                        <option value="text/x-java">java</option>
                    </select>
                </div>
                <PlayFill className='runBtn' size={30} onClick={runCode} />
            </div>
            <div ref={ref} className="mainWrap">
                <div className="editorWrap">
                    <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        editorRef={editorRef}
                        onLangChange={(lang) => {
                            langRef.current = lang;
                            document.getElementById("langOption").value = lang;
                        }}
                        onCodeChange={(code) => {
                            codeRef.current = code;
                        }}
                    />
                </div>
                <div id="resizeMe" className="MiddleDiv">
                    <div className="resizer" onMouseDown={mouseDownHandler}> </div>
                    <div className="ResizableBox">
                        <div className="InputBox">
                            <textarea className='textArea'
                                type="text"
                                value={inputText}

                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Enter input here"
                            />
                        </div>
                        <div className="OutputBox">
                            <textarea className='textArea'
                                value={codeOutput}
                                placeholder="Output will appear here"
                                readOnly
                            />
                        </div>
                    </div>
                </div>
                <div className="aside">
                    <div className="asideInner">
                        <div className="logo">
                            <img
                                className="logoImage"
                                src="/icon.png"
                                alt="logo"
                            />
                        </div>
                        <h4>Connected Users</h4>
                        <div className="clientsList">
                            {clients.map((client) => (
                                <Client
                                    key={client.socketId}
                                    username={client.username}
                                />
                            ))}
                        </div>
                    </div>
                    <button className="btn_copyBtn" onClick={copyCode}>
                        Copy Code
                    </button>
                    <button className="btn_copyBtn" onClick={copyRoomId}>
                        Copy ROOM ID
                    </button>
                    <button className="btn_leaveBtn" onClick={leaveRoom}>
                        Leave
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditorPage
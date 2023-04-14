import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { PlayFill } from 'react-bootstrap-icons';
import axios from "axios";
import { BsSendFill } from "react-icons/bs";
import ScrollToBottom from "react-scroll-to-bottom"

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
    const [menu_isOpen, setMenuOpen] = useState(false);

    // for chats_____________________________________________________________
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);

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

            // listening for chat messages
            socketRef.current.on(ACTIONS.RECEIVE_MSG, (data) => {
                setMessageList((list) => [...list, data]);
                toast(`New Message from ${data.author}`, {
                    icon: '✉️',
                  });
                  console.log(data)
            });

        };
        init();

        //to close all the listeners, return in useEffect is used as a cleaning function
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    function sendMessage() {
        if (currentMessage !== "") {
            const messageData = {
                room: roomId,
                author: location.state?.username,
                message: currentMessage,
                // time:
                //     new Date(Date.now()).getHours() +
                //     ":" +
                //     new Date(Date.now()).getMinutes(),
            };
            socketRef.current.emit(ACTIONS.SEND_MSG, messageData);
            setMessageList((list) => [...list, messageData]);
            setCurrentMessage("");
        }
    };

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

        const program = {
            script: codeRef.current,
            language: currLang,
            stdin: inputText,
            versionIndex: "4",
            clientId: process.env.REACT_APP_CLIENT_ID,
            clientSecret: process.env.REACT_APP_CLIENT_SECRET
        };
        const axiosConfig = {
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        };
        // axios.post('https://cors-anywhere.herokuapp.com/https://api.jdoodle.com/v1/execute', program)
        axios.post('https://api.jdoodle.com/v1/execute', program)
            .then((response) => {
                console.log('response:', response)
                setData("CPU Time:" + response.data.cpuTime + "  Memory:" + response.data.memory + "\n\n" + response.data.output)
            })
            .catch((error) => {
                console.log('error:', error);
                setData(error)
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
    const resizer_id = document.getElementById('resizeMe');
    const editor_id = document.getElementById('editor');
    const mouseDownHandler = (e) => {
        // Get the current mouse position
        x = e.clientX;

        // Calculate the dimension of element
        const styles = window.getComputedStyle(resizer_id);

        w = parseInt(styles.width);
        // Attach the listeners to `document`
        ref.current.addEventListener('mousemove', mouseMoveHandler);
        ref.current.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (e) => {
        const dx = x - e.clientX;
        resizer_id.style.width = `${w + dx}px`;
        editor_id.style.width = `calc(100% - 170px - ${w + dx}px)`;
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

    //_____MENU___________________________________________________________________________________-
    const toggleMenu = () => {
        setMenuOpen(!menu_isOpen);
    };


    return (
        <div className='main'>

            <div className={`menu ${menu_isOpen ? 'open' : ''}`}>
                <button className="close-btn" onClick={toggleMenu}>x</button>
                <ScrollToBottom className="message-container">
                    {messageList.map((messageContent) => {
                        return (
                            <div
                                className="message"
                                id={location.state?.username === messageContent.author ? "you" : "other"}
                            >
                                <div className='msg-div'>
                                    <div className="author">{messageContent.author}</div>
                                    <div className='message-content'>{messageContent.message}</div>
                                </div>
                            </div>
                        );
                    })}
                </ScrollToBottom>
                <div className='bottom_menu'>
                    <input type="text" placeholder="Enter msg" value={currentMessage}
                        onChange={(e) => {
                            setCurrentMessage(e.target.value);
                        }}
                        onKeyPress={(e) => {
                            e.key === "Enter" && sendMessage();
                        }} />
                    <button type="submit" onClick={sendMessage}><BsSendFill size={23} /></button>
                </div>
            </div>

            <div className='upperPanel'>
                <div className='options'>
                    <label class="visually-hidden" for="autoSizingSelect">Language: &nbsp;</label>
                    <select class="form-select" id="langOption" onChange={setLanguage}>
                        <option selected>Select</option>
                        <option value="text/x-c++src">cpp</option>
                        <option value="text/x-python">python3</option>
                        <option value="text/x-java">java</option>
                    </select>
                </div>
                <PlayFill className='runBtn' size={30} onClick={runCode} />
                <button className="copy_codeBtn" onClick={copyCode}>Copy Code</button>
                <button className={!menu_isOpen ? 'chat_btn' : 'hidden'} onClick={toggleMenu}>
                    Chats
                </button>
            </div>
            <div ref={ref} className="mainWrap">
                <div id="editor" className="editorWrap">
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

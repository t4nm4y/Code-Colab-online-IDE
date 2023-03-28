import React, { useEffect, useRef } from 'react';

import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';

import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, editorRef, onCodeChange }) => {
    // const editorRef = useRef(null);
    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                //it will covert the text area with this idea to a code editor
                document.getElementById('realtimeEditor'),
                {
                    // mode: { name: 'javascript', json: true },
                    mode: 'text/x-c++src',
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );
            //event listener for any change in the text area
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue(); //to get all, whatever is written in the text area
                onCodeChange(code);
                //setValue means it was already there in the text area, we have not made any changes
                //it technically means what was already set, ie. what we recieved orignally 
                // console.log(origin);
                if (origin !== 'setValue') {
                    // console.log("code change")
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                        lang:null
                    });
                }
            });
            editorRef.current.on('optionChange',(instance)=> {
                    // console.log("language changed")
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code:null,
                        lang:instance.options.mode
                    });
            });
        } 
        init();
    },[]);

    useEffect(() => { 
        //we put this in new useEffect, so that we could use the dependency
        if (socketRef.current) { //this useEffect will only activate if socketRef.current is not NULL
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code, lang}) => {
                if(lang!==null && lang!==editorRef.current.options.mode){
                    editorRef.current.setOption("mode",lang);
                }
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]); //this is the depenency, which means this useEffect will only activate if there is some change in the dependency(socketRef.current)
 
    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;

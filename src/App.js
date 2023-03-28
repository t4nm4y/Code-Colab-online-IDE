
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';

function App() {
  return (
    <>
    {/* creating global div so that toaster can access it anytime */}
    <div>
        <Toaster position="top-right"></Toaster>
    </div>
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Home/>}></Route>
            {/* :roomId means that it is dynamic so : is used */}
            <Route path='/editor/:roomId' element={<EditorPage/>}></Route>
        </Routes>
    </BrowserRouter>
    </>
  )
}

export default App;

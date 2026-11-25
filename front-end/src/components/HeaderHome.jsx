import { useNavigate } from 'react-router-dom';
import SplitLeaseLogo from "../assets/splitlease-blank-background-logo.png";
import "./HeaderButtons.css";
import "./Header.css";
const HeaderHome = ({user}) => {

    const navigate = useNavigate();

    return(
         <div className="pageHeader">
            <div className='headerButtons'>
                            <img
                                    src={SplitLeaseLogo}
                                    alt="SplitLease logo"
                                    className="logo"
                                    onClick={() => navigate('/home')}
                            />

                            <button className="backButtonC" onClick={() => navigate('/profile')}> User Profile </button>
                            
            </div>
            <h1 className="pageHeaderTitle">Welcome Back {user}</h1>
        </div>
    )
}
export default HeaderHome;
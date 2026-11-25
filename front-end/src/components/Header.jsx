import HeaderButtons from "./HeaderButtons";
import "./Header.css";

const Header = ({ page_title, backTo }) => {
  return (
    <div className="pageHeader">
      <HeaderButtons backTo={backTo} />
      <h1 className="pageHeaderTitle">{page_title}</h1>
    </div>
  );
};

export default Header;
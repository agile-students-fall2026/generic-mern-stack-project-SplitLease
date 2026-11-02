import Login from './login/Login'

const App = () => {
  return <Login onLoginSuccess={user => alert('Logged in as ' + user.name)} />
}

export default App

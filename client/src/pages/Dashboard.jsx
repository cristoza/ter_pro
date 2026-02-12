import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: Call API to logout
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome to the Dashboard</h2>
      <p>You have successfully logged in.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;

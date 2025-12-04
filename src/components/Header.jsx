import React from 'react';
import { FaClock, FaTachometerAlt, FaTasks, FaChartPie } from 'react-icons/fa';

const Header = ({ activeTab, setActiveTab }) => {
    return (
        <header>
            <div className="container">
                <div className="header-content">
                    <div className="logo">
                        <FaClock />
                        <span>Horax</span>
                    </div>
                    <div className="nav-tabs">
                        <div
                            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <FaTachometerAlt /> Dashboard
                        </div>
                        <div
                            className={`nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tasks')}
                        >
                            <FaTasks /> Tasks
                        </div>
                        <div
                            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            <FaChartPie /> Analytics
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

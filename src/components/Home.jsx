import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Home = () => {
    const [memoryData, setMemoryData] = useState({});
    const [diskData, setDiskData] = useState({});
    const [cpuUsage, setCpuUsage] = useState(0);
    const [processData, setProcessData] = useState({});
    const [processNames, setProcessNames] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch data from all endpoints
    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch memory metrics
            const memoryResponse = await axios.get('http://localhost:8080/metrics/memory');
            setMemoryData(memoryResponse.data);

            // Fetch disk metrics
            const diskResponse = await axios.get('http://localhost:8080/metrics/disk');
            setDiskData(diskResponse.data);

            // Fetch CPU usage
            const cpuResponse = await axios.get('http://localhost:8080/metrics/cpu/usage');
            setCpuUsage(cpuResponse.data);

            // Fetch running processes count
            const processResponse = await axios.get('http://localhost:8080/metrics/processes');
            setProcessData(processResponse.data);

            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    // Fetch process names with their CPU usage
    const fetchProcessNames = async () => {
        try {
            const response = await axios.get('http://localhost:8080/metrics/cpu/usage/per-process');
            setProcessNames(Object.entries(response.data) || []); // Convert object to array of [key, value] pairs
            setShowModal(true);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 16 * 60 * 1000); // Fetch data every 16 minutes
        return () => clearInterval(interval);
    }, []);

    if (error) {
        return <div className="text-red-600">Error fetching data: {error}</div>;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    const formatPercentage = (value) => (value ? value.toFixed(2) : '0');

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-semibold mb-4">System Dashboard</h1>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {/* Memory Usage */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Memory Usage</h2>
                    <div className="w-32 mx-auto mb-4">
                        <CircularProgressbar
                            value={memoryData.memoryUsagePercentage || 0}
                            text={`${formatPercentage(memoryData.memoryUsagePercentage)}%`}
                            styles={buildStyles({
                                pathColor: (memoryData.memoryUsagePercentage || 0) > 75 ? 'red' : '#3b82f6',
                                textColor: (memoryData.memoryUsagePercentage || 0) > 75 ? 'red' : '#3b82f6',
                            })}
                        />
                    </div>
                    <p>Total Memory: {memoryData['Total Memory']} GB</p>
                    <p>Available Memory: {memoryData['Available Memory']} GB</p>
                </div>

                {/* Disk Usage */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Disk Usage</h2>
                    <div className="w-32 mx-auto mb-4">
                        <CircularProgressbar
                            value={diskData.diskUsagePercentage || 0}
                            text={`${formatPercentage(diskData.diskUsagePercentage)}%`}
                            styles={buildStyles({
                                pathColor: (diskData.diskUsagePercentage || 0) > 75 ? 'red' : '#3b82f6',
                                textColor: (diskData.diskUsagePercentage || 0) > 75 ? 'red' : '#3b82f6',
                            })}
                        />
                    </div>
                    <p>Total Disk Space: {diskData['Total Disk Space']} GB</p>
                    <p>Available Disk Space: {diskData['Available Disk Space']} GB</p>
                </div>

                {/* CPU Usage */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">CPU Usage</h2>
                    <div className="w-32 mx-auto mb-4">
                        <CircularProgressbar
                            value={cpuUsage || 0}
                            text={`${formatPercentage(cpuUsage)}%`}
                            styles={buildStyles({
                                pathColor: cpuUsage > 75 ? 'red' : '#3b82f6',
                                textColor: cpuUsage > 75 ? 'red' : '#3b82f6',
                            })}
                        />
                    </div>
                    <p>CPU Usage: {formatPercentage(cpuUsage)}%</p>
                </div>

                {/* Running Processes */}
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Running Processes</h2>
                    <div className="w-32 mx-auto mb-4 cursor-pointer" onClick={fetchProcessNames}>
                        <CircularProgressbar
                            value={processData['Running Process Count'] || 0}
                            text={processData['Running Process Count'] ? processData['Running Process Count'].toString() : '0'}
                        />
                    </div>
                    <p>Running Process Count: {processData['Running Process Count'] || 0}</p>
                </div>
            </div>

            {/* Modal for Process Names */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-3xl h-3/4 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Running Processes</h2>
                            <button
                                className="text-red-500 font-bold"
                                onClick={() => setShowModal(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div>
                            {processNames
                                .sort((a, b) => b[1] - a[1])
                                .map(([name, usage], index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between bg-gray-100 p-2 rounded shadow-sm mb-2"
                                    >
                                        <span>{name}</span>
                                        <span>{formatPercentage(usage)}%</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;

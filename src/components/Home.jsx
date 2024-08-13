import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { format } from 'date-fns';

const Home = () => {
    const [memoryData, setMemoryData] = useState({});
    const [diskData, setDiskData] = useState({});
    const [cpuUsage, setCpuUsage] = useState(0); // Initialize with default value
    const [processData, setProcessData] = useState({});
    const [processNames, setProcessNames] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [timestamp, setTimestamp] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:8080/metrics/latest');
            const data = response.data;

            const bytesToGB = (bytes) => (bytes / (1024 ** 3)).toFixed(2);

            setMemoryData({
                memoryUsagePercentage: (data.totalMemory - data.availableMemory) / data.totalMemory * 100,
                'Total Memory': bytesToGB(data.totalMemory),
                'Available Memory': bytesToGB(data.availableMemory),
            });
            setDiskData({
                diskUsagePercentage: (data.totalDiskSpace - data.usableDiskSpace) / data.totalDiskSpace * 100,
                'Total Disk Space': bytesToGB(data.totalDiskSpace),
                'Available Disk Space': bytesToGB(data.usableDiskSpace),
            });
            setCpuUsage(data.cpuUsage != null ? data.cpuUsage : 0); // Set default value if null or undefined
            setProcessData({ 'Running Process Count': data.numberOfProcesses });
            setProcessNames(data.processNames || []); // Handle cases where processNames might be undefined
            setTimestamp(data.timestamp);
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 16 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchProcessNames = async () => {
        try {
            const response = await axios.get('http://localhost:8080/metrics/cpu/usage/per-process');
            setProcessNames(response.data || []); // Handle cases where response data might be undefined
            setShowModal(true);
        } catch (error) {
            setError(error.message);
        }
    };

    if (error) {
        return <div className="text-red-600">Error fetching data: {error}</div>;
    }

    const formattedTimestamp = timestamp ? format(new Date(timestamp), 'MMMM d, yyyy, h:mm a') : '';

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-semibold mb-4">System Dashboard</h1>
            <p className="text-lg mb-8">
                Latest Timestamp: <span className="font-bold text-blue-600">{formattedTimestamp}</span>
            </p>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Memory Usage</h2>
                    <div className="w-32 mx-auto mb-4">
                        <CircularProgressbar
                            value={memoryData.memoryUsagePercentage || 0} // Provide default value if undefined
                            text={`${(memoryData.memoryUsagePercentage || 0).toFixed(2)}%`}
                            styles={buildStyles({
                                pathColor: (memoryData.memoryUsagePercentage || 0) > 75 ? 'red' : '#3b82f6',
                                textColor: (memoryData.memoryUsagePercentage || 0) > 75 ? 'red' : '#3b82f6'
                            })}
                        />
                    </div>
                    <p>Total Memory: {memoryData['Total Memory']} GB</p>
                    <p>Available Memory: {memoryData['Available Memory']} GB</p>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Disk Usage</h2>
                    <div className="w-32 mx-auto mb-4">
                        <CircularProgressbar
                            value={diskData.diskUsagePercentage || 0} // Provide default value if undefined
                            text={`${(diskData.diskUsagePercentage || 0).toFixed(2)}%`}
                            styles={buildStyles({
                                pathColor: (diskData.diskUsagePercentage || 0) > 75 ? 'red' : '#3b82f6',
                                textColor: (diskData.diskUsagePercentage || 0) > 75 ? 'red' : '#3b82f6'
                            })}
                        />
                    </div>
                    <p>Total Disk Space: {diskData['Total Disk Space']} GB</p>
                    <p>Available Disk Space: {diskData['Available Disk Space']} GB</p>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">CPU Usage</h2>
                    <div className="w-32 mx-auto mb-4">
                        <CircularProgressbar
                            value={cpuUsage || 0} // Handle undefined or null value
                            text={`${(cpuUsage || 0).toFixed(2)}%`}
                            styles={buildStyles({
                                pathColor: (cpuUsage || 0) > 75 ? 'red' : '#3b82f6',
                                textColor: (cpuUsage || 0) > 75 ? 'red' : '#3b82f6'
                            })}
                        />
                    </div>
                    <p>CPU Usage: {cpuUsage.toFixed(2)}%</p>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Running Processes</h2>
                    <div className="w-32 mx-auto mb-4 cursor-pointer" onClick={fetchProcessNames}>
                        <CircularProgressbar
                            value={processData['Running Process Count'] || 0} // Provide default value if undefined
                            text={processData['Running Process Count'] ? processData['Running Process Count'].toString() : '0'}
                        />
                    </div>
                    <p>Running Process Count: {processData['Running Process Count'] || 0}</p>
                </div>
            </div>

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
                            {Object.entries(processNames)
                                .sort((a, b) => b[1] - a[1])
                                .map(([name, usage], index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between bg-gray-100 p-2 rounded shadow-sm mb-2"
                                    >
                                        <span>{name}</span>
                                        <span>{usage.toFixed(2)}%</span>
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

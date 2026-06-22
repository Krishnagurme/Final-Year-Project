import { runtimeMetricsService } from './src/services/runtimeMetrics.service.js';

console.log('Testing Runtime Metrics Service...\n');

// Test system metrics
console.log('1. System Metrics:');
const systemMetrics = runtimeMetricsService.getSystemMetrics();
console.log(JSON.stringify(systemMetrics, null, 2));

// Test process metrics
console.log('\n2. Process Metrics:');
const processMetrics = runtimeMetricsService.getProcessMetrics();
console.log(JSON.stringify(processMetrics, null, 2));

// Test disk metrics
console.log('\n3. Disk Metrics:');
const diskMetrics = runtimeMetricsService.getDiskMetrics();
console.log(JSON.stringify(diskMetrics, null, 2));

// Test API metrics
console.log('\n4. API Metrics:');
const apiMetrics = runtimeMetricsService.getAPIMetrics();
console.log(JSON.stringify(apiMetrics, null, 2));

// Test request tracking
console.log('\n5. Testing request tracking...');
runtimeMetricsService.trackRequest('GET', '/api/test', 200, 150);
runtimeMetricsService.trackRequest('POST', '/api/users', 201, 250);
runtimeMetricsService.trackRequest('GET', '/api/courses', 200, 100);
runtimeMetricsService.trackRequest('GET', '/api/error', 500, 50);

const updatedApiMetrics = runtimeMetricsService.getAPIMetrics();
console.log(JSON.stringify(updatedApiMetrics, null, 2));

console.log('\n✅ Runtime Metrics Service test completed successfully!');

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Divider, 
  Alert, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

// Color constants for styling
const COLORS = {
  prompt: '#0088FE',
  completion: '#00C49F',
  total: '#8884D8',
};

const TokenUsageDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter state
  const [startDateStr, setStartDateStr] = useState(getDateString(30)); // 30 days ago
  const [endDateStr, setEndDateStr] = useState(getDateString(0)); // today
  const [daysFilter, setDaysFilter] = useState(30);
  const [serviceFilter, setServiceFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  
  // List of services for filter dropdown (will be populated from data)
  const [availableServices, setAvailableServices] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);

  // Helper function to get date string for n days ago
  function getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Fetch summary data
  const fetchSummaryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching token usage data with session token:", localStorage.getItem('session_token'));
      const response = await axios.get('/api/admin/token-usage/summary', {
        params: {
          session_token: localStorage.getItem('session_token'),
          start_date: startDateStr,
          end_date: endDateStr,
          service: serviceFilter || undefined,
          model: modelFilter || undefined
        }
      });
      
      console.log("Token usage data received:", response.data);
      setSummary(response.data);
      
      // Extract unique services and models for filters
      if (response.data && response.data.detailed_usage) {
        const services = new Set();
        const models = new Set();
        
        response.data.detailed_usage.forEach(item => {
          services.add(item.service);
          models.add(item.model);
        });
        
        setAvailableServices(Array.from(services));
        setAvailableModels(Array.from(models));
      }
    } catch (err) {
      console.error('Error fetching token usage summary:', err);
      setError('Failed to fetch token usage data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch daily data
  const fetchDailyData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching daily token usage data with session token:", localStorage.getItem('session_token'));
      const response = await axios.get('/api/admin/token-usage/daily', {
        params: {
          session_token: localStorage.getItem('session_token'),
          days: daysFilter,
          service: serviceFilter || undefined
        }
      });
      
      console.log("Daily token usage data received:", response.data);
      setDailyData(response.data.daily_usage || []);
    } catch (err) {
      console.error('Error fetching daily token usage:', err);
      setError('Failed to fetch daily usage data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    fetchSummaryData();
    fetchDailyData();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setStartDateStr(getDateString(30));
    setEndDateStr(getDateString(0));
    setDaysFilter(30);
    setServiceFilter('');
    setModelFilter('');
    
    // Refetch with reset filters
    setTimeout(() => {
      fetchSummaryData();
      fetchDailyData();
    }, 0);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    }).format(value);
  };
  
  // Format large numbers
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Get token distribution as percentage
  const getTokenDistribution = () => {
    if (!summary) return { prompt: 0, completion: 0 };
    
    const total = summary.total_prompt_tokens + summary.total_completion_tokens;
    return {
      prompt: summary.total_prompt_tokens / total * 100,
      completion: summary.total_completion_tokens / total * 100
    };
  };

  // Initial data fetch
  useEffect(() => {
    fetchSummaryData();
    fetchDailyData();
  }, []);
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        OpenAI Token Usage Dashboard
      </Typography>
      
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Start Date"
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="End Date"
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Days (Daily Chart)</InputLabel>
                <Select
                  value={daysFilter}
                  label="Days (Daily Chart)"
                  onChange={(e) => setDaysFilter(e.target.value)}
                >
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                  <MenuItem value={90}>Last 90 days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Service</InputLabel>
                <Select
                  value={serviceFilter}
                  label="Service"
                  onChange={(e) => setServiceFilter(e.target.value)}
                >
                  <MenuItem value="">All Services</MenuItem>
                  {availableServices.map((service) => (
                    <MenuItem key={service} value={service}>{service}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Model</InputLabel>
                <Select
                  value={modelFilter}
                  label="Model"
                  onChange={(e) => setModelFilter(e.target.value)}
                >
                  <MenuItem value="">All Models</MenuItem>
                  {availableModels.map((model) => (
                    <MenuItem key={model} value={model}>{model}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={6}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleApplyFilters}
                sx={{ mr: 1 }}
              >
                Apply Filters
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
        
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Tokens
                </Typography>
                <Typography variant="h5" component="div">
                  {formatNumber(summary.total_tokens)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Cost
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(summary.total_cost)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  API Requests
                </Typography>
                <Typography variant="h5" component="div">
                  {formatNumber(summary.total_requests)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Average Cost per Request
                </Typography>
                <Typography variant="h5" component="div">
                  {formatCurrency(summary.total_requests ? summary.total_cost / summary.total_requests : 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Token Distribution */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Token Type Distribution
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Prompt Tokens: {formatNumber(summary.total_prompt_tokens)} 
                    ({(summary.total_prompt_tokens / summary.total_tokens * 100).toFixed(1)}%)
                  </Typography>
                  <Box sx={{ 
                    height: 25, 
                    background: COLORS.prompt, 
                    width: `${getTokenDistribution().prompt}%`,
                    borderRadius: 1,
                    mb: 2
                  }}/>
                  
                  <Typography variant="body2" gutterBottom>
                    Completion Tokens: {formatNumber(summary.total_completion_tokens)} 
                    ({(summary.total_completion_tokens / summary.total_tokens * 100).toFixed(1)}%)
                  </Typography>
                  <Box sx={{ 
                    height: 25, 
                    background: COLORS.completion, 
                    width: `${getTokenDistribution().completion}%`,
                    borderRadius: 1
                  }}/>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Usage Summary
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {dailyData.length > 0 ? (
                    dailyData.slice(0, 5).map((day, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          {day.date}: {formatNumber(day.total_tokens)} tokens 
                          ({formatCurrency(day.total_cost)})
                        </Typography>
                        <Box sx={{ 
                          height: 20, 
                          background: COLORS.total, 
                          width: `${day.total_tokens / Math.max(...dailyData.map(d => d.total_tokens)) * 100}%`,
                          borderRadius: 1
                        }}/>
                      </Box>
                    ))
                  ) : (
                    <Typography>No daily data available</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Detailed Usage Table */}
      {summary && summary.detailed_usage && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Detailed Usage by Service and Model
            </Typography>
            
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="token usage table">
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell align="right">Prompt Tokens</TableCell>
                    <TableCell align="right">Completion Tokens</TableCell>
                    <TableCell align="right">Total Tokens</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="right">Requests</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.detailed_usage.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {row.service}
                      </TableCell>
                      <TableCell>{row.model}</TableCell>
                      <TableCell align="right">{formatNumber(row.prompt_tokens)}</TableCell>
                      <TableCell align="right">{formatNumber(row.completion_tokens)}</TableCell>
                      <TableCell align="right">{formatNumber(row.total_tokens)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.total_cost)}</TableCell>
                      <TableCell align="right">{formatNumber(row.request_count)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default TokenUsageDashboard;
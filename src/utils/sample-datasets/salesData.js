export const salesDataset = {
  name: 'Global_Tech_Sales_2024.csv',
  description: 'Enterprise hardware & software revenue records across global sales territories with discounting and customer tiers.',
  data: [
    { Order_ID: 'ORD-1001', Date: '2024-01-05', Region: 'North America', Product: 'Enterprise Cloud Suite', Category: 'Software', Units: 14, Unit_Price: 1200, Revenue: 16800, Discount_Pct: 5, Customer_Segment: 'Enterprise' },
    { Order_ID: 'ORD-1002', Date: '2024-01-08', Region: 'Europe', Product: 'AI Inference Server', Category: 'Hardware', Units: 4, Unit_Price: 6500, Revenue: 26000, Discount_Pct: 10, Customer_Segment: 'Enterprise' },
    { Order_ID: 'ORD-1003', Date: '2024-01-12', Region: 'Asia-Pacific', Product: 'Cybersecurity Gateway', Category: 'Hardware', Units: 25, Unit_Price: 850, Revenue: 21250, Discount_Pct: 0, Customer_Segment: 'SMB' },
    { Order_ID: 'ORD-1004', Date: '2024-01-18', Region: 'North America', Product: 'Data Analytics Tool', Category: 'Software', Units: 40, Unit_Price: 350, Revenue: 14000, Discount_Pct: 15, Customer_Segment: 'Government' },
    { Order_ID: 'ORD-1005', Date: '2024-01-25', Region: 'Latin America', Product: 'Cloud Storage Tier-1', Category: 'Services', Units: 60, Unit_Price: 120, Revenue: 7200, Discount_Pct: 0, Customer_Segment: 'SMB' },
    { Order_ID: 'ORD-1006', Date: '2024-02-02', Region: 'Europe', Product: 'Enterprise Cloud Suite', Category: 'Software', Units: 22, Unit_Price: 1200, Revenue: 26400, Discount_Pct: 5, Customer_Segment: 'Enterprise' },
    { Order_ID: 'ORD-1007', Date: '2024-02-09', Region: 'North America', Product: 'AI Inference Server', Category: 'Hardware', Units: 8, Unit_Price: 6500, Revenue: 52000, Discount_Pct: 12, Customer_Segment: 'Enterprise' },
    { Order_ID: 'ORD-1008', Date: '2024-02-14', Region: 'Asia-Pacific', Product: 'Data Analytics Tool', Category: 'Software', Units: 35, Unit_Price: 350, Revenue: 12250, Discount_Pct: 5, Customer_Segment: 'SMB' },
    { Order_ID: 'ORD-1009', Date: '2024-02-21', Region: 'Europe', Product: 'Cybersecurity Gateway', Category: 'Hardware', Units: 18, Unit_Price: 850, Revenue: 15300, Discount_Pct: 0, Customer_Segment: 'Government' },
    { Order_ID: 'ORD-1010', Date: '2024-02-28', Region: 'Middle East', Product: 'Cloud Storage Tier-1', Category: 'Services', Units: 90, Unit_Price: 120, Revenue: 10800, Discount_Pct: 8, Customer_Segment: 'SMB' },
    { Order_ID: 'ORD-1011', Date: '2024-03-04', Region: 'North America', Product: 'AI Supercluster Node', Category: 'Hardware', Units: 2, Unit_Price: 48000, Revenue: 96000, Discount_Pct: 15, Customer_Segment: 'Enterprise' }, // Outlier high revenue
    { Order_ID: 'ORD-1012', Date: '2024-03-10', Region: 'Asia-Pacific', Product: 'Enterprise Cloud Suite', Category: 'Software', Units: 19, Unit_Price: 1200, Revenue: 22800, Discount_Pct: 10, Customer_Segment: 'Enterprise' },
    { Order_ID: 'ORD-1013', Date: '2024-03-15', Region: 'Europe', Product: 'Data Analytics Tool', Category: 'Software', Units: 55, Unit_Price: 350, Revenue: 19250, Discount_Pct: 10, Customer_Segment: 'SMB' },
    { Order_ID: 'ORD-1014', Date: '2024-03-22', Region: 'Latin America', Product: 'Cybersecurity Gateway', Category: 'Hardware', Units: 12, Unit_Price: 850, Revenue: 10200, Discount_Pct: 5, Customer_Segment: 'Government' },
    { Order_ID: 'ORD-1015', Date: '2024-03-29', Region: 'North America', Product: 'Cloud Storage Tier-1', Category: 'Services', Units: 110, Unit_Price: 120, Revenue: 13200, Discount_Pct: 12, Customer_Segment: 'SMB' },
    { Order_ID: 'ORD-1016', Date: '2024-04-05', Region: 'Europe', Product: 'AI Inference Server', Category: 'Hardware', Units: 6, Unit_Price: 6500, Revenue: 39000, Discount_Pct: 8, Customer_Segment: 'Enterprise' },
    { Order_ID: 'ORD-1017', Date: '2024-04-12', Region: 'Asia-Pacific', Product: 'Enterprise Cloud Suite', Category: 'Software', Units: 16, Unit_Price: 1200, Revenue: 19200, Discount_Pct: 5, Customer_Segment: 'Enterprise' },
    { Order_ID: 'ORD-1018', Date: '2024-04-19', Region: 'North America', Product: 'Cybersecurity Gateway', Category: 'Hardware', Units: 30, Unit_Price: 850, Revenue: 25500, Discount_Pct: 0, Customer_Segment: 'Government' },
    { Order_ID: 'ORD-1019', Date: '2024-04-26', Region: 'Middle East', Product: 'Data Analytics Tool', Category: 'Software', Units: 45, Unit_Price: 350, Revenue: 15750, Discount_Pct: 5, Customer_Segment: 'SMB' },
    { Order_ID: 'ORD-1020', Date: '2024-05-03', Region: 'Europe', Product: 'Cloud Storage Tier-1', Category: 'Services', Units: 85, Unit_Price: 120, Revenue: 10200, Discount_Pct: 0, Customer_Segment: 'SMB' },
    { Order_ID: 'ORD-1021', Date: '2024-05-10', Region: 'North America', Product: 'Enterprise Cloud Suite', Category: 'Software', Units: 28, Unit_Price: 1200, Revenue: 33600, Discount_Pct: 10, Customer_Segment: 'Enterprise' },
    { Order_ID: 'ORD-1022', Date: '2024-05-18', Region: 'Asia-Pacific', Product: 'AI Inference Server', Category: 'Hardware', Units: 9, Unit_Price: 6500, Revenue: 58500, Discount_Pct: 15, Customer_Segment: 'Enterprise' },
    { Order_ID: 'ORD-1023', Date: '2024-05-24', Region: 'Latin America', Product: 'Data Analytics Tool', Category: 'Software', Units: 20, Unit_Price: 350, Revenue: 7000, Discount_Pct: 0, Customer_Segment: 'Government' },
    { Order_ID: 'ORD-1024', Date: '2024-05-30', Region: 'Europe', Product: 'Cybersecurity Gateway', Category: 'Hardware', Units: null, Unit_Price: 850, Revenue: null, Discount_Pct: 5, Customer_Segment: 'SMB' }, // Missing values
    { Order_ID: 'ORD-1024', Date: '2024-05-30', Region: 'Europe', Product: 'Cybersecurity Gateway', Category: 'Hardware', Units: null, Unit_Price: 850, Revenue: null, Discount_Pct: 5, Customer_Segment: 'SMB' }, // Duplicate row
  ]
};

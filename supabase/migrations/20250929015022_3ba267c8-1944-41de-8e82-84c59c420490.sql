-- Create lenders table for PA CDFI Network lenders
CREATE TABLE public.lenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  organization_type TEXT,
  description TEXT,
  services TEXT[],
  loan_types TEXT[],
  loan_range_min NUMERIC,
  loan_range_max NUMERIC,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'PA',
  zip_code TEXT,
  counties_served TEXT[],
  industries_served TEXT[],
  is_cdfi BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lenders ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view lenders
CREATE POLICY "Authenticated users can view lenders" 
ON public.lenders 
FOR SELECT 
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_lenders_updated_at
BEFORE UPDATE ON public.lenders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert PA CDFI Network lenders
INSERT INTO public.lenders (name, organization_type, description, services, loan_types, loan_range_min, loan_range_max, website, email, phone, address, city, state, zip_code, counties_served, industries_served) VALUES
('Community First Fund', 'CDFI', 'Community development financial institution serving central and eastern Pennsylvania', 
 ARRAY['Business loans', 'Technical assistance', 'Financial counseling'], 
 ARRAY['Microloans', 'Small business loans', 'Working capital', 'Equipment financing', 'Real estate'],
 500, 500000,
 'https://communityfirstfund.org', 'info@communityfirstfund.org', '(717) 393-2351',
 '44 N Queen St', 'Lancaster', 'PA', '17603',
 ARRAY['Lancaster', 'York', 'Dauphin', 'Lebanon', 'Berks', 'Chester'],
 ARRAY['Retail', 'Service', 'Manufacturing', 'Food service', 'Healthcare']),

('Philadelphia Industrial Development Corporation (PIDC)', 'CDFI', 'Economic development corporation and CDFI for Philadelphia businesses',
 ARRAY['Business loans', 'Real estate financing', 'Tax credits', 'Grant programs'],
 ARRAY['Working capital', 'Equipment loans', 'Real estate loans', 'Construction loans'],
 10000, 5000000,
 'https://www.pidcphila.com', 'info@pidcphila.com', '(215) 496-8020',
 '1500 Market St, Suite 2600 West', 'Philadelphia', 'PA', '19102',
 ARRAY['Philadelphia'],
 ARRAY['Manufacturing', 'Technology', 'Life sciences', 'Food production', 'Creative industries']),

('The Enterprise Center', 'CDFI', 'Minority business accelerator and CDFI serving Greater Philadelphia',
 ARRAY['Business loans', 'Business training', 'Incubation services', 'Technical assistance'],
 ARRAY['Microloans', 'Small business loans', 'Start-up loans'],
 500, 100000,
 'https://www.theenterprisecenter.com', 'info@theenterprisecenter.com', '(215) 895-4000',
 '4548 Market Street', 'Philadelphia', 'PA', '19139',
 ARRAY['Philadelphia', 'Montgomery', 'Delaware', 'Chester', 'Bucks'],
 ARRAY['Technology', 'Professional services', 'Retail', 'Food service']),

('Bridgeway Capital', 'CDFI', 'Community development finance institution serving Western Pennsylvania',
 ARRAY['Business loans', 'Real estate financing', 'New Markets Tax Credits'],
 ARRAY['Working capital', 'Equipment financing', 'Real estate loans', 'Bridge loans'],
 50000, 2500000,
 'https://www.bridgewaycapital.org', 'info@bridgewaycapital.org', '(412) 201-2450',
 '564 Forbes Avenue, Suite 1802', 'Pittsburgh', 'PA', '15219',
 ARRAY['Allegheny', 'Westmoreland', 'Butler', 'Beaver', 'Washington', 'Fayette'],
 ARRAY['Manufacturing', 'Healthcare', 'Technology', 'Non-profit', 'Real estate development']),

('ASSETS Lancaster', 'Non-profit CDFI', 'Business training and lending for entrepreneurs in Lancaster',
 ARRAY['Business training', 'Microloans', 'Individual Development Accounts', 'Business coaching'],
 ARRAY['Microloans', 'Start-up loans'],
 500, 50000,
 'https://www.assetslancaster.org', 'info@assetslancaster.org', '(717) 393-6089',
 '24 S Queen St', 'Lancaster', 'PA', '17603',
 ARRAY['Lancaster'],
 ARRAY['Food service', 'Retail', 'Service businesses', 'Creative industries']),

('Impact Loan Fund', 'CDFI', 'Community development financial institution serving Pennsylvania communities',
 ARRAY['Business loans', 'Developer loans', 'Community facility loans'],
 ARRAY['Small business loans', 'Real estate loans', 'Construction loans', 'Bridge financing'],
 25000, 1000000,
 'https://impactloanfund.org', 'info@impactloanfund.org', '(267) 758-1035',
 'Philadelphia', 'Philadelphia', 'PA', '19103',
 ARRAY['Philadelphia', 'Montgomery', 'Bucks', 'Chester', 'Delaware'],
 ARRAY['Real estate', 'Non-profit', 'Small business', 'Community facilities']),

('Reinvestment Fund', 'CDFI', 'National CDFI with strong Pennsylvania presence',
 ARRAY['Business loans', 'Real estate financing', 'Policy solutions', 'Data analysis'],
 ARRAY['Small business loans', 'Commercial real estate', 'Community facilities', 'Housing loans'],
 50000, 10000000,
 'https://www.reinvestment.com', 'info@reinvestment.com', '(215) 574-5800',
 '1700 Market Street, 19th Floor', 'Philadelphia', 'PA', '19103',
 ARRAY['All Pennsylvania counties'],
 ARRAY['Healthcare', 'Education', 'Food access', 'Housing', 'Small business']),

('Entrepreneur Works', 'CDFI', 'Supporting small businesses in Western Pennsylvania',
 ARRAY['Microloans', 'Business coaching', 'Financial education'],
 ARRAY['Microloans', 'Start-up loans', 'Working capital'],
 500, 50000,
 'https://www.entrepreneurworks.org', 'info@entrepreneurworks.org', '(814) 206-2061',
 '117 E Beaver Ave, Suite 205', 'State College', 'PA', '16801',
 ARRAY['Centre', 'Clearfield', 'Clinton', 'Mifflin', 'Blair', 'Huntingdon'],
 ARRAY['Retail', 'Service', 'Technology', 'Food service']),

('Economic Opportunities Fund (EOF)', 'CDFI', 'Business lending throughout Pennsylvania',
 ARRAY['Business loans', 'SBA loans', 'Lines of credit', 'Equipment financing'],
 ARRAY['Term loans', 'Lines of credit', 'SBA 504 loans', 'Equipment loans'],
 10000, 5000000,
 'https://www.eof.org', 'info@eof.org', '(215) 923-4488',
 '1617 JFK Blvd, Suite 1260', 'Philadelphia', 'PA', '19103',
 ARRAY['All Pennsylvania counties'],
 ARRAY['Manufacturing', 'Wholesale', 'Service', 'Retail', 'Technology']),

('The Progress Fund', 'CDFI', 'Rural business development in Southwestern Pennsylvania',
 ARRAY['Business loans', 'Tourism development', 'Trail Towns program', 'Technical assistance'],
 ARRAY['Microloans', 'Small business loans', 'Real estate loans', 'Tourism loans'],
 5000, 350000,
 'https://www.progressfund.org', 'info@progressfund.org', '(724) 216-9160',
 '425 West Pittsburgh Street', 'Greensburg', 'PA', '15601',
 ARRAY['Westmoreland', 'Fayette', 'Somerset', 'Bedford', 'Fulton', 'Washington'],
 ARRAY['Tourism', 'Outdoor recreation', 'Retail', 'Restaurants', 'Small manufacturing']),

('Finanta', 'CDFI', 'Business lending for underserved communities in Greater Philadelphia',
 ARRAY['Business loans', 'SBA microloans', 'Business advising'],
 ARRAY['Microloans', 'Small business loans', 'SBA loans'],
 500, 350000,
 'https://finanta.org', 'info@finanta.org', '(215) 546-9426',
 '1608 Walnut Street, Suite 802', 'Philadelphia', 'PA', '19103',
 ARRAY['Philadelphia', 'Montgomery', 'Bucks', 'Chester', 'Delaware'],
 ARRAY['Small business', 'Women-owned', 'Minority-owned', 'Immigrant-owned']),

('Community Capital Works', 'CDFI', 'Financing for community development projects',
 ARRAY['Acquisition loans', 'Construction loans', 'Mini-perm loans', 'New Markets Tax Credits'],
 ARRAY['Real estate loans', 'Bridge loans', 'Construction financing'],
 100000, 5000000,
 'https://ccworks.org', 'info@ccworks.org', '(215) 882-4110',
 '1315 Walnut Street, Suite 1426', 'Philadelphia', 'PA', '19107',
 ARRAY['Philadelphia', 'Montgomery', 'Delaware', 'Chester', 'Bucks'],
 ARRAY['Affordable housing', 'Community facilities', 'Charter schools', 'Non-profits']);

-- Create lender_contacts table for tracking user interactions
CREATE TABLE public.lender_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lender_id UUID NOT NULL REFERENCES public.lenders(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL, -- 'inquiry', 'application', 'follow_up'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'approved', 'declined'
  notes TEXT,
  contact_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lender_contacts
ALTER TABLE public.lender_contacts ENABLE ROW LEVEL SECURITY;

-- Policies for lender_contacts
CREATE POLICY "Users can view their own lender contacts" 
ON public.lender_contacts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lender contacts" 
ON public.lender_contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lender contacts" 
ON public.lender_contacts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lender contacts" 
ON public.lender_contacts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for lender_contacts updated_at
CREATE TRIGGER update_lender_contacts_updated_at
BEFORE UPDATE ON public.lender_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
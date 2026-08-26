import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw as RefreshIcon } from 'lucide-react';
import { API_BASE } from '../config';
import { Renewals } from '../Components/CustomerTabs';

export default function RenewalsPage() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/policies`)
      .then((res) => setPolicies(res.data))
      .catch((err) => console.error('Failed to load policies', err))
      .finally(() => setLoading(false));
  }, []);

  const handlePolicyUpdated = (policy: any) => {
    setPolicies((prev) => prev.map((p) => (p.id === policy.id ? policy : p)));
  };

  return (
    <div className="font-sans bg-surface-muted text-text h-full flex flex-col">
      <div className="px-8 pt-6 pb-2 border-b border-border max-md:px-4 max-md:pt-4">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2.5 max-md:text-xl">
          <RefreshIcon size={24} className="text-primary-600" /> Renewal
        </h1>
        <p className="text-sm text-text-muted mt-1 max-md:text-xs">Every customer's policy, with renewal status and assigned agent</p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted"><RefreshIcon size={20} className="animate-spin" /></div>
      ) : (
        <Renewals
          policies={policies}
          onSelectCustomer={(customer) => navigate(`/customers?openCustomerId=${customer.id}`)}
          onPolicyUpdated={handlePolicyUpdated}
        />
      )}
    </div>
  );
}

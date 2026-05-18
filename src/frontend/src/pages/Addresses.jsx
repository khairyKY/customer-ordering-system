import React, { useState } from 'react';
import NeonButton from '../components/ui/NeonButton';
import TerminalInput from '../components/ui/TerminalInput';

export default function Addresses() {
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      label: 'Primary Shipping',
      name: 'Alice Liddell',
      street: '123 Wonderland Ave, Suite 42',
      city: 'Metropolis',
      state: 'NY',
      zip: '10001',
      country: 'United States'
    }
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    label: '', name: '', street: '', city: '', state: '', zip: '', country: ''
  });

  const handleOpenModal = (addr = null) => {
    if (addr) {
      setEditingId(addr.id);
      setFormData(addr);
    } else {
      setEditingId(null);
      setFormData({ label: '', name: '', street: '', city: '', state: '', zip: '', country: '' });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingId) {
      setAddresses(addresses.map(a => a.id === editingId ? { ...formData, id: editingId } : a));
    } else {
      setAddresses([...addresses, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 flex flex-col gap-6" data-testid="account-addresses">
      <h1 className="font-mono text-[28px] font-bold text-on-background mb-1">// ADDRESSES</h1>
      <p className="font-mono text-[13px] text-text-muted mb-6">Manage your shipping and billing destinations.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map(addr => (
          <div key={addr.id} className="border border-outline-variant bg-surface-container-low/60 backdrop-blur-xl p-6 flex flex-col gap-4 shadow-lg">
            <h2 className="font-inter text-label-md text-primary-container uppercase tracking-wider">{addr.label || 'Address'}</h2>
            <div className="font-mono text-[14px] text-on-background leading-relaxed flex-grow">
              {addr.name}<br/>
              {addr.street}<br/>
              {addr.city}, {addr.state} {addr.zip}<br/>
              {addr.country}
            </div>
            <NeonButton variant="secondary" className="mt-4 w-fit" onClick={() => handleOpenModal(addr)}>[ EDIT ]</NeonButton>
          </div>
        ))}
        
        <div 
          onClick={() => handleOpenModal()}
          className="border border-outline-variant border-dashed bg-transparent p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary-container transition-all group min-h-[200px]"
        >
          <span className="font-mono text-[32px] text-text-muted group-hover:text-primary-container">+</span>
          <span className="font-mono text-[13px] text-text-muted uppercase group-hover:text-primary-container tracking-widest">Add New Address</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-dark border border-outline-variant p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-mono text-[18px] text-on-background mb-4 uppercase">
              // {editingId ? 'EDIT_ADDRESS' : 'NEW_ADDRESS'}
            </h3>
            <div className="flex flex-col gap-3">
              <TerminalInput placeholder="LABEL (e.g. Home)" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />
              <TerminalInput placeholder="FULL NAME" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <TerminalInput placeholder="STREET" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
              <div className="flex gap-3">
                <TerminalInput placeholder="CITY" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                <TerminalInput placeholder="STATE" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <TerminalInput placeholder="ZIP" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} />
                <TerminalInput placeholder="COUNTRY" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <NeonButton variant="secondary" onClick={() => setShowModal(false)}>[ CANCEL ]</NeonButton>
              <NeonButton variant="primary" onClick={handleSave}>[ SAVE ]</NeonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

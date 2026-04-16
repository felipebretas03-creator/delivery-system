import React from 'react';

function Layout({ activeTab, setActiveTab, children }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'entregas', label: 'Entregas', icon: '📦' },
    { id: 'motoboys', label: 'Motoboys', icon: '🛵' },
    { id: 'financeiro', label: 'Financeiro', icon: '💰' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--main-bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--sidebar-bg)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
      }}>
        <div style={{ padding: '0 24px', marginBottom: '40px' }}>
          {/* Logo Placeholder like "Etichetta" */}
          <h2 style={{ color: 'white', fontSize: '28px', fontStyle: 'italic', margin: 0 }}>
            Delivery<span style={{fontWeight: 300}}>Sys</span>
          </h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: isActive ? '600' : '400',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '24px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          DeliverySys Inc. 2026
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Header */}
        <header style={{
          height: '70px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '0 32px',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button style={{
              width: '36px', height: '36px', borderRadius: '50%', 
              backgroundColor: 'var(--accent-color)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1rem'
            }}>?</button>
            <button style={{
              width: '36px', height: '36px', borderRadius: '50%', 
              backgroundColor: 'var(--accent-color)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1rem'
            }}>U</button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;

import React from 'react';
import Help from '../components/Help';
import { HelpCircle } from 'lucide-react';

const HelpPage = () => {
  return (
    <div id="help-section" className="page-section">
      <div style={{ padding: '2rem 0' }}>
        <Help />
      </div>
    </div>
  );
};

export default HelpPage;


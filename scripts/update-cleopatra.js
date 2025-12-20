/**
 * Update Cleopatra's accessories to include crown, necklace, and lion
 * Run: node scripts/update-cleopatra.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rddvqbxbmpilbimmppvu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZHZxYnhibXBpbGJpbW1wcHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODMyMDAsImV4cCI6MjA3Nzg1OTIwMH0.8y4fFG3WamhU2TTZ2albS50fQrMWldZV_bGXDy9vqMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCleopatra() {
  console.log('Fetching Cleopatra...');

  // First, get the current record
  const { data: current, error: fetchError } = await supabase
    .from('custom_wakattors')
    .select('*')
    .eq('character_id', 'cleopatra')
    .single();

  if (fetchError) {
    console.error('Error fetching Cleopatra:', fetchError);
    return;
  }

  if (!current) {
    console.log('Cleopatra not found in database');
    return;
  }

  console.log('Current customization:', JSON.stringify(current.customization, null, 2));

  // Update the customization with accessories array
  const newCustomization = {
    ...current.customization,
    accessories: ['crown', 'necklace', 'lion']
  };

  // Remove old accessory field if present
  delete newCustomization.accessory;

  console.log('New customization:', JSON.stringify(newCustomization, null, 2));

  // Update the record
  const { error: updateError } = await supabase
    .from('custom_wakattors')
    .update({ customization: newCustomization })
    .eq('character_id', 'cleopatra');

  if (updateError) {
    console.error('Error updating Cleopatra:', updateError);
    return;
  }

  // Verify the update
  const { data: verified, error: verifyError } = await supabase
    .from('custom_wakattors')
    .select('customization')
    .eq('character_id', 'cleopatra')
    .single();

  if (verifyError) {
    console.error('Error verifying update:', verifyError);
    return;
  }

  console.log('Successfully updated Cleopatra!');
  console.log('New accessories:', verified.customization.accessories);
}

updateCleopatra();

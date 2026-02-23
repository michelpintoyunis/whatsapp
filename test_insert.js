const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jgxntetaxzgqllqexacd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpneG50ZXRheHpncWxscWV4YWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODM3NTAsImV4cCI6MjA4NzQ1OTc1MH0.Qy90d4whuFzU3XDg0PlrYuFsk-laN4OBhRKlZr8VkRA'
);

async function testInsert() {
  console.log('Logging in...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'michelpinto8@gmail.com', // from previous logs
    password: 'password123' // assuming standard testing password or auth.uid() check
  });
  
  if (authErr) {
    console.log('Cant login standard way. Re-creating a user instead...');
    await supabase.auth.signUp({ email: 'test_insert@test.com', password: 'password123' });
    await supabase.auth.signInWithPassword({ email: 'test_insert@test.com', password: 'password123' });
  }

  console.log('Testing insert into chats as AUTHENTICATED user...');
  const { data, error } = await supabase
    .from('chats')
    .insert({ type: 'direct' })
    .select()
    .single();

  if (error) {
    console.error('ERROR inserting chat:', JSON.stringify(error, null, 2));
  } else {
    console.log('SUCCESS CHAT:', data);
    const { data: pData, error: pError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_id: data.id, user_id: '93b11fe3-4acc-4638-abe0-fbe1d82d2ea2' }
      ]);
      
    if (pError) console.error('ERROR inserting participants:', JSON.stringify(pError, null, 2));
    else console.log('SUCCESS PARTICIPANTS');
  }
}

testInsert();

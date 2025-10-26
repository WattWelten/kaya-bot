// Test-Script für Link-Integration nach LLM-Prompt-Update
const testQueries = [
    {
        query: "Ich brauche Bürgergeld",
        expectedLinks: true,
        description: "Jobcenter mit Link zum Antrag"
    },
    {
        query: "Wann tagt der Kreistag?",
        expectedLinks: true,
        description: "Politik mit Link zu Sitzungskalender"
    },
    {
        query: "Auto zulassen",
        expectedLinks: true,
        description: "KFZ mit Link zur Terminbuchung"
    }
];

const url = 'https://api.kaya.wattweiser.com';

async function testLinkIntegration(query, description) {
    console.log(`\n🧪 Testing: "${query}"`);
    console.log(`   Description: ${description}`);

    try {
        const response = await fetch(`${url}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: query,
                sessionId: `test_link_${Date.now()}`
            })
        });

        const data = await response.json();
        
        console.log(`   ✅ Response received`);
        
        // Check for Markdown links
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const links = data.response.match(markdownLinkRegex);
        
        if (links && links.length > 0) {
            console.log(`   ✅ Markdown links found: ${links.length}`);
            links.forEach(link => {
                console.log(`      • ${link}`);
            });
        } else {
            console.log(`   ❌ No Markdown links found`);
        }
        
        // Check for technical format (should NOT exist)
        const technicalLinkRegex = /→ \[.*?\]/g;
        const technicalLinks = data.response.match(technicalLinkRegex);
        
        if (technicalLinks) {
            console.log(`   ⚠️ Technical links still present: ${technicalLinks.join(', ')}`);
        } else {
            console.log(`   ✅ No technical '→ [Link]' format`);
        }
        
        // Show response preview
        console.log(`   Response Preview: ${data.response.substring(0, 150)}...`);
        
        return { success: true, hasLinks: links && links.length > 0 };
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return { success: false, hasLinks: false };
    }
}

// Main test execution
(async () => {
    console.log('🚀 Testing Link Integration after LLM Prompt Update...');
    console.log('='.repeat(60));
    
    // Wait for deployment (Railway takes ~4-5 min)
    console.log('⏳ Waiting 30 seconds for deployment to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const results = {
        passed: 0,
        failed: 0,
        withLinks: 0
    };

    for (const test of testQueries) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
        const result = await testLinkIntegration(test.query, test.description);
        
        if (result.success) {
            results.passed++;
            if (result.hasLinks) {
                results.withLinks++;
            }
        } else {
            results.failed++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results:');
    console.log(`   ✅ API Responses: ${results.passed}/${testQueries.length}`);
    console.log(`   🔗 With Markdown Links: ${results.withLinks}/${testQueries.length}`);
    console.log(`   📈 Link Success Rate: ${(results.withLinks / testQueries.length * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (results.withLinks === testQueries.length) {
        console.log('✅ SUCCESS: All responses contain Markdown links!');
        process.exit(0);
    } else if (results.withLinks > 0) {
        console.log('⚠️ PARTIAL: Some responses contain Markdown links');
        process.exit(0);
    } else {
        console.log('❌ FAILED: No Markdown links found');
        process.exit(1);
    }
})();


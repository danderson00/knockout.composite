using System;
using System.Collections.Generic;
using System.IO;
using NUnit.Framework;

namespace NQUnit.NUnit.JavaScriptTests.NQUnit
{
    [TestFixture]
    public class QUnitTests
    {
        [Test, TestCaseSource("GetQUnitTests")]
        public void Test(QUnitTest test)
        {
            test.ShouldPass();
        }

        public IEnumerable<QUnitTest> GetQUnitTests()
        {
            string testsDirectory;
            if(Environment.MachineName.ToUpper() == "TFS")
                testsDirectory = Path.Combine(Environment.CurrentDirectory, "../Sources/Tests");
            else
                testsDirectory = Path.Combine(Environment.CurrentDirectory, "../../Tests");
            return global::NQUnit.NQUnit.GetTests(Directory.GetFiles(testsDirectory, "runner.htm"));
        }
    }
}
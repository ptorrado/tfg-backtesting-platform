import sys
import pytest

if __name__ == "__main__":
    # Add current directory to path just in case
    sys.path.append('.')
    import contextlib
    
    print("Running tests via pytest.main() with capture...")
    
    with open("final_log.txt", "w", encoding="utf-8") as f:
        with contextlib.redirect_stdout(f), contextlib.redirect_stderr(f):
            # Run all tests in app/tests
            ret = pytest.main(["-v", "-p", "no:warnings", "app/tests/"])
    
    print(f"Tests finished with code {ret}")
    sys.exit(ret)

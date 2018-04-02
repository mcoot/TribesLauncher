#pragma once

extern "C" {
	// Inject a DLL into a process
	bool inject(const char* processName, const char* dllFile);

	// Get a process's status
	bool isProcessRunning(const char* processName);
}


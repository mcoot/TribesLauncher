// injector.cpp : Defines the exported functions for the DLL application.
//

#include "stdafx.h"
#include "injector.h"

extern "C" {
	//////////////// Static prototypes

	static HANDLE getProcess(const char* processName);
	static bool injectHandle(HANDLE process, const char* dllFile);

	//////////////// Process Status
	bool isProcessRunning(const char* processName) {
		HANDLE process = getProcess(processName);
		if (process == NULL) {
			return false;
		}
		CloseHandle(process);
		return true;
	}

	//////////////// Injection

	bool inject(const char* processName, const char* dllFile) {
		return injectHandle(getProcess(processName), dllFile);
	}

	static bool injectHandle(HANDLE process, const char* dllFile) {
		if (process == NULL) {
			// Process is not open
			return false;
		}

		// Get full DLL path
		char dllPath[MAX_PATH];
		GetFullPathNameA(dllFile, MAX_PATH, dllPath, NULL);

		// Get the LoadLibraryA method from the kernel32 dll
		LPVOID LoadLib = (LPVOID)GetProcAddress(GetModuleHandle(L"kernel32.dll"), "LoadLibraryA");

		// Allocate memory in the processs for the DLL path, and then write it there
		LPVOID remotePathSpace = VirtualAllocEx(process, NULL, strlen(dllPath), MEM_RESERVE | MEM_COMMIT, PAGE_READWRITE);
		if (!WriteProcessMemory(process, remotePathSpace, dllPath, strlen(dllPath), NULL)) {
			// Failed to write memory
			CloseHandle(process);
			return false;
		}

		// Load the DLL with CreateRemoteThread + LoadLibraryA
		HANDLE remoteThread = CreateRemoteThread(process, NULL, NULL, (LPTHREAD_START_ROUTINE)LoadLib, (LPVOID)remotePathSpace, NULL, NULL);

		if (remoteThread == NULL) {
			// Failed to create remote thread to load the DLL
			CloseHandle(process);
			return false;
		}

		// Close the handle to the process
		CloseHandle(process);
		return true;
	}

	static HANDLE getProcess(const char* processName) {
		WCHAR wProcessName[MAX_PATH];
		mbstate_t mbstate;
		mbsrtowcs_s(NULL, wProcessName, &processName, MAX_PATH, &mbstate);

		// Take a snapshot of processes currently running
		HANDLE runningProcesses = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
		if (runningProcesses == INVALID_HANDLE_VALUE) {
			return NULL;
		}

		PROCESSENTRY32 pe;
		pe.dwSize = sizeof(PROCESSENTRY32);

		// Find the desired process
		BOOL res = Process32First(runningProcesses, &pe);
		while (res) {
			if (wcscmp(pe.szExeFile, wProcessName) == 0) {
				// Found the process
				CloseHandle(runningProcesses);
				HANDLE process = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pe.th32ProcessID);
				if (process == NULL) {
					// Process failed to open
					return NULL;
				}
				// Return a handle to this process
				return process;
			}
			res = Process32Next(runningProcesses, &pe);
		}

		// Couldn't find the process
		CloseHandle(runningProcesses);
		return NULL;
	}
}


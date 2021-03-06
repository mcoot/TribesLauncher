// dllmain.cpp : Defines the entry point for the DLL application.
#include "stdafx.h"

BOOL APIENTRY DllMain( HMODULE hModule,
                       DWORD  ul_reason_for_call,
                       LPVOID lpReserved
                     )
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
		MessageBoxA(NULL, "Process Attach", "Process Attach", 0);
    case DLL_THREAD_ATTACH:
		MessageBoxA(NULL, "Thread Attach", "Thread Attach", 0);
    case DLL_THREAD_DETACH:
		MessageBoxA(NULL, "Thread Detach", "Thread Detach", 0);
    case DLL_PROCESS_DETACH:
		MessageBoxA(NULL, "Process Detach", "Process Detach", 0);
        break;
    }
    return TRUE;
}


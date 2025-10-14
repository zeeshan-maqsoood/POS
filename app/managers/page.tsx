// 'use client';

// import { usePermissions } from '@/hooks/use-permissions';
// import { withAuth } from '@/components/withAuth';

// function ManagersPage() {
//   const { user, canManageManagers } = usePermissions();

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-6">Managers</h1>
      
//       <div className="bg-white rounded-lg shadow p-6">
//         <h2 className="text-xl font-semibold mb-4">Manager List</h2>
        
//         {canManageManagers && (
//           <div className="mb-6">
//             <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
//               Add New Manager
//             </button>
//           </div>
//         )}

//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Name
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Email
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Role
//                 </th>
//                 {canManageManagers && (
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 )}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {/* Example row - replace with actual data */}
//               <tr>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   John Doe
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                   john@example.com
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                   Manager
//                 </td>
//                 {canManageManagers && (
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                     <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
//                     <button className="text-red-600 hover:text-red-900">Delete</button>
//                   </td>
//                 )}
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Protect the page with required permission
// export default withAuth(ManagersPage, {
//   requiredPermission: 'MANAGER_READ',
//   redirectTo: '/login',
// });

import React from 'react'

const page = () => {
  return (
    <div>page</div>
  )
}

export default page

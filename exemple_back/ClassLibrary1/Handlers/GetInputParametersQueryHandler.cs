using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using WebApplication1.Application.Dto;
using WebApplication1.Application.Dto.Adapters;
using WebApplication1.Application.Queries.Requests;
using WebApplication1.CrossCutting;
using WebApplication1.Infrastructure.StoredProc;
using WebApplication1.Infrastructure.StoredProc.XmlFiles.CalculationParameters;
using WebApplication1.Infrastructure.StoredProc.XmlFiles.ComputationParameters;

namespace WebApplication1.Application.Queries.Handlers
{
    internal class GetInputParametersQueryHandler : IRequestHandler<GetInputParametersQuery, InputParametersDto>
    {
        private readonly IMothusStoredProcFacade _storedProcFacade;
        private readonly IAuthenticationProvider _authenticationProvider;

        public GetInputParametersQueryHandler(
            IAuthenticationProvider authenticationProvider,
            IMothusStoredProcFacade storedProcFacade)
        {
            _storedProcFacade = storedProcFacade;
            _authenticationProvider = authenticationProvider;
        }

        public async Task<InputParametersDto> Handle(GetInputParametersQuery request, CancellationToken cancellationToken)
        {
            IEnumerable<ESP_APP_GetCaseStudyBasicInfo_Result> resultList = await _storedProcFacade.ESP_APP_GetCaseStudyBasicInfo(request.CaseStudyId).ConfigureAwait(false);

            ESP_APP_GetCaseStudyBasicInfo_Result caseStudyBasicInfo = resultList.Single();

            if ((AccessTypeDto)caseStudyBasicInfo.Configuration_TypeAccess != AccessTypeDto.Public)
            {
                _authenticationProvider.EnsureUserOrAdmin(caseStudyBasicInfo.Configuration_UserId.Value);
            }

            CalculationParametersDto calculationParameters = caseStudyBasicInfo.Configuration_CalculationParameters.DeserializeXml<InputCalculationParameters>()?.ToDto();
            ComputationParametersDto computationParameters = _authenticationProvider.HasAccessLevel(AccessLevel.SuperAdministrator) ?
                caseStudyBasicInfo.Configuration_ComputationParameters.DeserializeXml<InputComputationParameters>()?.ToDto() :
                null;

            return new InputParametersDto
            {
                CalculationParameters = calculationParameters,
                ComputationParameters = computationParameters
            };
        }
    }
}

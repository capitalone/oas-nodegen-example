/*
 * Copyright 2016 Capital One Services, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License. 
 */

package org.openapis.example.manual;

import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;

import org.openapis.example.common.PaginatedList;
import org.springframework.beans.factory.annotation.Qualifier;

@Path("/manual/members")
public class MemberResource extends AbstractResource<Member> {
	private MemberRepository service;

	@Inject
	public MemberResource(@Qualifier("manualMemberRepository") MemberRepository service) {
		super(service);

		this.service = service;
	}

	@GET
	@Path("/byName/{name}")
	public PaginatedList<Member> findByName(@PathParam("name") String name) {
		return new PaginatedList<Member>(service.findByName(name));
	}
}
